// src/hooks/useBooks.ts  ── Typesense-powered, Google-tier search
import { useState, useEffect, useCallback, useRef } from "react";
import { typesenseClient, BOOKS_COLLECTION } from "../lib/typesenseClient";
import { supabase } from "../lib/supabaseClient";
import { groupBooksByTitle } from "../utils/shelfUtils";
import type { BookRow, BookGroup, FilterState, Facets } from "../types/book";

// ─── Types returned by Typesense ─────────────────────────────────────────────
interface TSDocument {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  publisher?: string;
  pub_year?: number;
  subject?: string;
  isbn?: string;
  item_types?: string[];
  status: string;
  available_copies: number;
  copy_count: number;
  total_checkouts: number;
  shelf?: string;
  call_number?: string;
  floor?: string;
  rack?: number;
  col?: number;
  edition?: string;
  row_ids?: string[];
}

interface TSHit {
  document: TSDocument;
  highlight?: Record<string, { snippet?: string; snippets?: string[] }>;
  text_match?: number;
}

interface TSFacetCount {
  field_name: string;
  counts: Array<{ value: string; count: number }>;
}

interface TSSearchResult {
  hits?: TSHit[];
  found: number;
  facet_counts?: TSFacetCount[];
  page: number;
  request_params: { per_page: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 25;

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

// ─── Build Typesense filter_by string ────────────────────────────────────────
function buildFilterBy(filters: FilterState, fieldMap: Record<string, string>): string {
  const parts: string[] = [];

  if (filters.availableOnly) {
    parts.push("status:=Available");
  }
  if (filters.subjects.length > 0) {
    parts.push(`subject:[${filters.subjects.map((s) => `\`${s}\``).join(",")}]`);
  }
  if (filters.itemTypes.length > 0) {
    parts.push(`item_types:[${filters.itemTypes.map((t) => `\`${t}\``).join(",")}]`);
  }
  if (filters.authors.length > 0) {
    parts.push(`author:[${filters.authors.map((a) => `\`${a}\``).join(",")}]`);
  }
  if (filters.publishers.length > 0) {
    parts.push(`publisher:[${filters.publishers.map((p) => `\`${p}\``).join(",")}]`);
  }
  if (filters.floors.length > 0) {
    parts.push(`floor:[${filters.floors.map((f) => `\`${f}\``).join(",")}]`);
  }
  if (filters.racks.length > 0) {
    parts.push(`rack:[${filters.racks.join(",")}]`);
  }
  if (filters.cols.length > 0) {
    parts.push(`col:[${filters.cols.join(",")}]`);
  }

  // Unused but kept for future dynamic filter_by extensions
  void fieldMap;

  return parts.join(" && ");
}

// ─── Parse web-search syntax ─────────────────────────────────────────────────
// Supports:
//   "exact phrase"  → pass through to Typesense as-is (it understands quotes)
//   -word           → Typesense supports negation natively with `-`
//   normal words    → typo-tolerant match
function sanitizeQuery(raw: string): string {
  // Typesense's search query syntax already supports "" and -word, so just
  // trim and pass through. We do strip stray backticks to avoid injection.
  return raw.replace(/`/g, "").trim();
}

// ─── Convert Typesense hit → lightweight BookGroup ───────────────────────────
// Full copy details are fetched lazily when a book is clicked.
function hitToBookGroup(hit: TSHit): BookGroup {
  const d = hit.document;
  return {
    title:           d.title,
    subtitle:        d.subtitle ?? null,
    author:          d.author ?? null,
    publisher:       d.publisher ?? null,
    pub_year:        d.pub_year?.toString() ?? null,
    subject:         d.subject ?? null,
    edition:         d.edition ?? null,
    shelf:           d.shelf ?? null,
    call_number:     d.call_number ?? null,
    status:          (d.status as BookGroup["status"]) ?? "Not Available",
    totalCopies:     d.copy_count,
    availableCopies: d.available_copies,
    // Lazy — filled when the user clicks a book
    variants:        [],
    // Store row_ids so we can load variants on demand
    _rowIds:         d.row_ids ?? [],
  } as BookGroup & { _rowIds: string[] };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useBooks(initialQuery = "", initialField = "Keyword") {
  const [searchTerm,      setSearchTerm]  = useState(initialQuery);
  const [searchField,     setSearchField] = useState(initialField);
  const [debouncedSearch, setDebounced]   = useState(initialQuery);
  const [page,            setPage]        = useState(1);

  const [groups,          setGroups]      = useState<BookGroup[]>([]);
  const [totalResults,    setTotalResults] = useState(0);
  const [loading,         setLoading]     = useState(false);
  const [error,           setError]       = useState<string | null>(null);
  const [filters,         setFilters]     = useState<FilterState>(DEFAULT_FILTERS);
  const [facets,          setFacets]      = useState<Facets>({
    subjects: [], authors: [], publishers: [], itemTypes: [],
    floors: [], racks: [], cols: [],
  });

  // ─── Debounce ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset page on new search
  useEffect(() => { setPage(1); }, [debouncedSearch, searchField, filters]);

  // ─── Typesense search ───────────────────────────────────────────────────
  const search = useCallback(async () => {
    const rawQ = debouncedSearch.trim();
    if (!rawQ) {
      setGroups([]);
      setTotalResults(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = sanitizeQuery(rawQ);

      // Map UI field names → Typesense field names
      const FIELD_MAP: Record<string, string> = {
        Keyword:   "title,author,subject,publisher,subtitle",
        Title:     "title",
        Author:    "author",
        Publisher: "publisher",
        Subject:   "subject",
        ISBN:      "isbn",
        Barcode:   "isbn", // no barcode field in grouped index; fall back
      };
      const queryBy = FIELD_MAP[searchField] ?? FIELD_MAP.Keyword;

      // Per-field weights: title=4, author=3, subject=2, publisher=1
      const WEIGHT_MAP: Record<string, string> = {
        "title,author,subject,publisher,subtitle": "4,3,2,1,1",
        title:     "4",
        author:    "3",
        publisher: "1",
        subject:   "2",
        isbn:      "1",
      };
      const queryByWeights = WEIGHT_MAP[queryBy] ?? undefined;

      const filterBy = buildFilterBy(filters, {});

      const params: Record<string, unknown> = {
        q,
        query_by:         queryBy,
        query_by_weights: queryByWeights,

        // ── Typo tolerance ─────────────────────────────────────────────────
        // Allow 1 typo for words ≥5 chars, 2 typos for ≥8 chars
        num_typos:        "2",
        typo_tokens_threshold: 1,

        // ── Stemming ───────────────────────────────────────────────────────
        // Typesense has built-in English stemming; enabled by default.
        // Set enable_typos_for_alpha_numerical_tokens:false to avoid
        // stemming ISBN/barcode fields.

        // ── Prefix search ──────────────────────────────────────────────────
        // Matches "comput" → "computer", "computing", etc.
        prefix:           "true",

        // ── Popularity boosting ────────────────────────────────────────────
        // Blend text-match score with total_checkouts
        sort_by:          `_text_match(buckets:10):desc,total_checkouts:desc`,

        // ── Facets for filters ─────────────────────────────────────────────
        facet_by:         "subject,author,publisher,item_types,status,floor,rack,col",
        max_facet_values: 50,

        // ── Pagination ─────────────────────────────────────────────────────
        per_page: PAGE_SIZE,
        page,

        // ── Filter ─────────────────────────────────────────────────────────
        ...(filterBy ? { filter_by: filterBy } : {}),

        // ── Highlight ──────────────────────────────────────────────────────
        highlight_full_fields: "title,author,subject",
        snippet_threshold:      30,
      };

      const result = (await typesenseClient
        .collections(BOOKS_COLLECTION)
        .documents()
        .search(params)) as TSSearchResult;

      const hits  = result.hits ?? [];
      const found = result.found ?? 0;

      setGroups(hits.map(hitToBookGroup));
      setTotalResults(found);

      // ── Parse facets ─────────────────────────────────────────────────────
      const facetMap: Record<string, string[]> = {};
      const rackSet  = new Set<number>();
      const colSet   = new Set<number>();

      for (const fc of result.facet_counts ?? []) {
        const values = fc.counts.map((c) => c.value);

        if (fc.field_name === "rack") {
          fc.counts.forEach((c) => rackSet.add(parseInt(c.value, 10)));
        } else if (fc.field_name === "col") {
          fc.counts.forEach((c) => colSet.add(parseInt(c.value, 10)));
        } else {
          facetMap[fc.field_name] = values;
        }
      }

      setFacets({
        subjects:   facetMap.subject     ?? [],
        authors:    facetMap.author      ?? [],
        publishers: facetMap.publisher   ?? [],
        itemTypes:  facetMap.item_types  ?? [],
        floors:     facetMap.floor       ?? [],
        racks:      [...rackSet].sort((a, b) => a - b),
        cols:       [...colSet].sort((a, b) => a - b),
      });

    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, searchField, filters, page]);

  useEffect(() => { void search(); }, [search]);

  // ─── Lazy-load variants (physical copies) from Supabase ─────────────────
  // Called only when the user clicks a book card
  const variantCache = useRef<Record<string, BookRow[]>>({});

  const loadVariants = useCallback(async (group: BookGroup): Promise<BookGroup> => {
    const rowIds = (group as BookGroup & { _rowIds?: string[] })._rowIds;
    if (!rowIds || rowIds.length === 0) return group;

    const cacheKey = rowIds.slice().sort().join(",");
    if (variantCache.current[cacheKey]) {
      return { ...group, variants: variantCache.current[cacheKey] };
    }

    const numericIds = rowIds.map(Number).filter((n) => !isNaN(n));
    const { data, error: e } = await supabase
      .from("books")
      .select("*")
      .in("id", numericIds);

    if (e || !data) return group;

    const variants = groupBooksByTitle(data as BookRow[])[0]?.variants ?? (data as BookRow[]);
    variantCache.current[cacheKey] = variants;
    return { ...group, variants };
  }, []);

  // ─── Filter toggle ───────────────────────────────────────────────────────
  const handleFilterChange = (category: keyof FilterState, value: unknown) => {
    if (category === "availableOnly") {
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

  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

  return {
    groups,
    loading, error,
    page,    totalPages, totalResults,
    setPage,
    facets,  filters,    setFilters,
    handleFilterChange,
    clearFilters: () => setFilters(DEFAULT_FILTERS),
    searchTerm,   setSearchTerm,
    searchField,  setSearchField,
    loadVariants,
    // Expose the filtered groups count (= totalResults when using TS)
    filteredGroups: groups,
  };
}