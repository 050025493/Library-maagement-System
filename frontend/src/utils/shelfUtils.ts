// src/utils/shelfUtils.ts
import type { BookRow, BookGroup, CopyStatus } from '../types/book';

// ─── Floor code → human label ─────────────────────────────────────────────────
export const FLOOR_MAP: Record<string, string> = {
  GD:    'Ground Floor',
  IF:    '1st Floor',
  IIF:   '2nd Floor',
  IIIF:  '3rd Floor',
  STACK: 'General Stack',
  'N/A': 'Unknown',
};

const FLOOR_PRIORITY: Record<string, number> = {
  GD:    0,
  IF:    1,
  IIF:   2,
  IIIF:  3,
  STACK: 99,
  'N/A': 100,
};

// ─── Parse shelf string e.g. "IIF-R16-C9-F" ──────────────────────────────────
export const parseShelf = (shelfStr: string | null | undefined) => {
  if (!shelfStr || shelfStr.trim() === '' || shelfStr === 'N/A') return null;

  const regex = /^([A-Z]+)-R(\d+)-C(\d+)-([A-Z0-9]+)$/;
  const match = shelfStr.trim().match(regex);

  if (match) {
    const floorCode = match[1];
    return {
      raw:           shelfStr,
      floorCode,
      floorLabel:    FLOOR_MAP[floorCode] ?? floorCode,
      rack:          parseInt(match[2], 10),
      col:           parseInt(match[3], 10),
      row:           match[4],
      floorPriority: FLOOR_PRIORITY[floorCode] ?? 99,
    };
  }

  // Non-standard format — still parseable as fallback
  return {
    raw:           shelfStr,
    floorCode:     'N/A',
    floorLabel:    'Unknown',
    rack:          999,
    col:           999,
    row:           'Z',
    floorPriority: 100,
  };
};

// ─── Derive availability status of a single physical copy ────────────────────
// Status logic based on new CSV fields:
//   - no barcode     → Not Available (ghost row)
//   - lost_status=1  → Lost
//   - not_for_loan=1 → Reference Only (in library, can't borrow)
//   - date_due set   → Checked Out
//   - otherwise      → Available
export const getStatus = (row: BookRow): CopyStatus => {
  if (!row.barcode || row.barcode.trim() === '') return 'Not Available';
  if (row.lost_status?.trim() === '1') return 'Lost';
  if (row.not_for_loan?.trim() === '1') return 'Reference Only';
  if (row.date_due && row.date_due.trim() !== '') return 'Checked Out';
  return 'Available';
};

// ─── Sort priority for physical copies ───────────────────────────────────────
// Available first, then by floor → rack → col → row
const STATUS_ORDER: Record<CopyStatus, number> = {
  Available:         0,
  'Checked Out':     1,
  'Reference Only':  2,
  Lost:              3,
  'Not Available':   4,
};

export const compareBooksByLocation = (a: BookRow, b: BookRow): number => {
  const sa = STATUS_ORDER[getStatus(a)];
  const sb = STATUS_ORDER[getStatus(b)];
  if (sa !== sb) return sa - sb;

  const locA = parseShelf(a.shelf);
  const locB = parseShelf(b.shelf);

  if (!locA && !locB) return 0;
  if (!locA) return 1;
  if (!locB) return -1;

  if (locA.floorPriority !== locB.floorPriority) return locA.floorPriority - locB.floorPriority;
  if (locA.rack !== locB.rack) return locA.rack - locB.rack;
  if (locA.col  !== locB.col)  return locA.col  - locB.col;
  return locA.row.localeCompare(locB.row);
};

// ─── Group raw rows into one BookGroup per unique title ───────────────────────
export const groupBooksByTitle = (books: BookRow[]): BookGroup[] => {
  const groups: Record<string, BookRow[]> = {};

  books.forEach((book) => {
    const key = (book.title ?? 'UNKNOWN').trim().toUpperCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(book);
  });

  return Object.values(groups).map((rows) => {
    rows.sort(compareBooksByLocation);
    const best = rows[0];

    const availableCopies = rows.filter((r) => getStatus(r) === 'Available').length;

    let groupStatus: CopyStatus = 'Not Available';
    if (availableCopies > 0)                               groupStatus = 'Available';
    else if (rows.some((r) => getStatus(r) === 'Checked Out'))    groupStatus = 'Checked Out';
    else if (rows.some((r) => getStatus(r) === 'Reference Only')) groupStatus = 'Reference Only';
    else if (rows.some((r) => getStatus(r) === 'Lost'))           groupStatus = 'Lost';

    return {
      title:           best.title,
      subtitle:        best.subtitle ?? null,
      author:          best.author ?? null,
      publisher:       best.publisher ?? null,
      pub_year:        best.pub_year ?? null,
      subject:         best.subject ?? null,
      edition:         best.edition ?? null,
      shelf:           best.shelf ?? null,
      call_number:     best.call_number ?? null,
      status:          groupStatus,
      totalCopies:     rows.length,
      availableCopies,
      variants:        rows,
    };
  });
};