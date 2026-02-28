// src/hooks/useBooks.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { groupBooksByTitle, parseShelf } from '../utils/shelfUtils';
import type { BookRow, BookGroup, FilterState, Facets } from '../types/book';

const PAGE_SIZE = 50;

const DEFAULT_FILTERS: FilterState = {
  availableOnly: false,
  subjects:      [],
  itemTypes:     [],
  authors:       [],
  publishers:    [],
  floors:        [],
  racks:         [],
  cols:          [],
};

// ─── Score a book group by how well it matches the search tokens ─────────────
// Higher score = closer match. Used to sort results by relevance.
const scoreGroup = (group: BookGroup, tokens: string[]): number => {
  if (!tokens.length) return 0;
  const fields = [
    (group.title    ?? '').toLowerCase(),
    (group.author   ?? '').toLowerCase(),
    (group.subject  ?? '').toLowerCase(),
    (group.publisher ?? '').toLowerCase(),
  ];
  let score = 0;
  for (const token of tokens) {
    for (const field of fields) {
      if (field.includes(token)) {
        // Exact word boundary match scores highest
        score += field === token ? 10 : field.startsWith(token) ? 5 : 2;
      }
    }
  }
  return score;
};

// ─── Build Supabase OR filter for a set of tokens across fields ──────────────
const buildTokenFilter = (tokens: string[], fields: string[]) => {
  const parts: string[] = [];
  for (const token of tokens) {
    for (const field of fields) {
      parts.push(`${field}.ilike.%${token}%`);
    }
  }
  return parts.join(',');
};

export function useBooks(initialQuery = '', initialField = 'Keyword') {
  const [searchTerm,      setSearchTerm]  = useState(initialQuery);
  const [searchField,     setSearchField] = useState(initialField);
  const [debouncedSearch, setDebounced]   = useState(initialQuery);
  const [page,            setPage]        = useState(1);
  const [allGroups,       setAllGroups]   = useState<BookGroup[]>([]);
  const [loading,         setLoading]     = useState(false);
  const [error,           setError]       = useState<string | null>(null);
  const [filters,         setFilters]     = useState<FilterState>(DEFAULT_FILTERS);

  // ─── Debounce ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { setPage(1); }, [debouncedSearch, searchField]);

  // ─── Smart fetch ─────────────────────────────────────────────────────────
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rawQ = debouncedSearch.trim();

      // No search — load nothing (empty state, not full catalog)
      if (!rawQ) {
        setAllGroups([]);
        setLoading(false);
        return;
      }

      // Tokenize: split on whitespace, remove empty, lowercase
      const tokens = rawQ.toLowerCase().split(/\s+/).filter(Boolean);

      // Decide which DB columns to search based on field selector
      const fieldColumns: Record<string, string[]> = {
        Keyword:   ['title', 'author', 'subject', 'publisher'],
        Title:     ['title'],
        Author:    ['author'],
        Publisher: ['publisher'],
        Subject:   ['subject'],
        ISBN:      ['isbn'],
        Barcode:   ['barcode'],
      };
      const cols = fieldColumns[searchField] ?? fieldColumns.Keyword;

      // ── Pass 1: search all tokens (any match) ────────────────────────────
      let q = supabase.from('books').select('*');

      if (searchField === 'Barcode') {
        q = q.eq('barcode', rawQ);
      } else if (searchField === 'ISBN') {
        q = q.ilike('isbn', `%${rawQ}%`);
      } else {
        // Multi-token OR query: any row that matches ANY token in ANY column
        q = q.or(buildTokenFilter(tokens, cols));
      }

      const { data: pass1, error: e1 } = await q
        .order('title', { ascending: true })
        .limit(5000);

      if (e1) throw e1;

      let rows: BookRow[] = pass1 ?? [];

      // ── Pass 2: fuzzy fallback — if results are empty, try each token separately ──
      // This handles typos by broadening the search (e.g. "javascrpt" → "javas")
      if (rows.length === 0 && tokens.length > 0 && searchField !== 'Barcode') {
        // Try progressively shorter prefixes of each token (min 3 chars)
        const fuzzyParts: string[] = [];
        for (const token of tokens) {
          // Use first 60% of each token as a fuzzy prefix
          const prefix = token.slice(0, Math.max(3, Math.floor(token.length * 0.6)));
          for (const col of cols) {
            fuzzyParts.push(`${col}.ilike.%${prefix}%`);
          }
        }
        if (fuzzyParts.length > 0) {
          const { data: pass2, error: e2 } = await supabase
            .from('books')
            .select('*')
            .or(fuzzyParts.join(','))
            .order('title', { ascending: true })
            .limit(5000);
          if (!e2) rows = pass2 ?? [];
        }
      }

      // ── Group, score, sort by relevance ──────────────────────────────────
      const grouped = groupBooksByTitle(rows);

      // Sort by relevance score (highest first), keeping alphabetical as tiebreaker
      const scored = grouped
        .map((g) => ({ group: g, score: scoreGroup(g, tokens) }))
        .sort((a, b) => b.score - a.score || a.group.title.localeCompare(b.group.title));

      setAllGroups(scored.map((s) => s.group));

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, searchField]);

  useEffect(() => { void fetchBooks(); }, [fetchBooks]);

  // ─── Client-side filtering ────────────────────────────────────────────────
  const filteredGroups = allGroups.filter((book) => {
    if (filters.availableOnly && book.status !== 'Available') return false;
    if (filters.subjects.length   > 0 && !filters.subjects.includes(book.subject ?? ''))   return false;
    if (filters.authors.length    > 0 && !filters.authors.includes(book.author ?? ''))     return false;
    if (filters.publishers.length > 0 && !filters.publishers.includes(book.publisher ?? '')) return false;
    if (filters.itemTypes.length  > 0) {
      if (!book.variants.some((v) => filters.itemTypes.includes(v.item_type ?? ''))) return false;
    }
    if (filters.floors.length > 0 || filters.racks.length > 0 || filters.cols.length > 0) {
      const loc = parseShelf(book.shelf);
      if (!loc) return false;
      if (filters.floors.length > 0 && !filters.floors.includes(loc.floorLabel)) return false;
      if (filters.racks.length  > 0 && !filters.racks.includes(loc.rack))        return false;
      if (filters.cols.length   > 0 && !filters.cols.includes(loc.col))          return false;
    }
    return true;
  });

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageGroups = filteredGroups.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ─── Facets ───────────────────────────────────────────────────────────────
  const facets: Facets = {
    subjects:   [...new Set(allGroups.map((b) => b.subject).filter(Boolean)    as string[])].sort(),
    authors:    [...new Set(allGroups.map((b) => b.author).filter(Boolean)     as string[])].sort(),
    publishers: [...new Set(allGroups.map((b) => b.publisher).filter(Boolean)  as string[])].sort(),
    itemTypes:  [...new Set(allGroups.flatMap((b) => b.variants.map((v) => v.item_type)).filter(Boolean) as string[])].sort(),
    floors: [], racks: [], cols: [],
  };
  allGroups.forEach((b) => {
    const loc = parseShelf(b.shelf);
    if (!loc) return;
    if (!facets.floors.includes(loc.floorLabel)) facets.floors.push(loc.floorLabel);
    if (!facets.racks.includes(loc.rack))        facets.racks.push(loc.rack);
    if (!facets.cols.includes(loc.col))          facets.cols.push(loc.col);
  });
  facets.floors.sort();
  facets.racks.sort((a, b) => a - b);
  facets.cols.sort((a, b) => a - b);

  // ─── Filter toggle ────────────────────────────────────────────────────────
  const handleFilterChange = (category: keyof FilterState, value: unknown) => {
    if (category === 'availableOnly') {
      setFilters((prev) => ({ ...prev, availableOnly: value as boolean }));
      return;
    }
    setFilters((prev) => {
      const current = prev[category] as (string | number)[];
      const v = value as string | number;
      const updated = current.includes(v)
        ? current.filter((item) => item !== v)
        : [...current, v];
      return { ...prev, [category]: updated };
    });
  };

  return {
    groups: pageGroups,
    filteredGroups,
    loading, error,
    page: safePage, totalPages,
    totalResults: filteredGroups.length,
    setPage,
    facets, filters, setFilters,
    handleFilterChange,
    clearFilters: () => setFilters(DEFAULT_FILTERS),
    searchTerm,   setSearchTerm,
    searchField,  setSearchField,
  };
}