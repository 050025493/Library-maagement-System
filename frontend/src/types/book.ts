// src/types/book.ts

// ─── Raw row from Supabase books table ───────────────────────────────────────
export interface BookRow {
  id: number;
  system_id: string | null;
  title: string;
  subtitle: string | null;
  author: string | null;
  co_authors: string | null;
  edition: string | null;
  publisher: string | null;
  pub_year: string | null;
  pub_place: string | null;
  isbn: string | null;
  language: string | null;
  dewey_class: string | null;
  subject: string | null;
  item_type: string | null;    // BK | REF | TH | CD | TR | AB | DC
  shelf: string | null;        // e.g. "IIF-R16-C9-F" — null = no physical location
  call_number: string | null;
  barcode: string | null;      // empty/null = ghost row (no physical copy)
  date_due: string | null;     // null = Available, date string = Checked Out
  not_for_loan: string | null; // "0" = loanable, "1" = not loanable (reference)
  lost_status: string | null;  // "0" = fine, "1" = lost
  home_library: string | null;
  date_acquired: string | null;
  total_checkouts: number | null;
  replacement_cost: string | null;
  pages: string | null;
}

// ─── Status for a single physical copy ───────────────────────────────────────
export type CopyStatus =
  | 'Available'
  | 'Checked Out'
  | 'Reference Only'
  | 'Lost'
  | 'Not Available';

// ─── Grouped book — one per unique title, all physical copies as variants ────
export interface BookGroup {
  title: string;
  subtitle: string | null;
  author: string | null;
  publisher: string | null;
  pub_year: string | null;
  subject: string | null;
  edition: string | null;
  shelf: string | null;        // best copy's shelf location
  call_number: string | null;
  status: CopyStatus;          // best status across all copies
  totalCopies: number;
  availableCopies: number;
  variants: BookRow[];
}

// ─── Parsed shelf location ────────────────────────────────────────────────────
export interface ParsedShelf {
  raw: string;
  floorCode: string;
  floorLabel: string;
  rack: number;
  col: number;
  row: string;
  floorPriority: number;
}

// ─── Active filter selections ─────────────────────────────────────────────────
export interface FilterState {
  availableOnly: boolean;
  subjects: string[];
  itemTypes: string[];
  authors: string[];
  publishers: string[];
  floors: string[];
  racks: number[];
  cols: number[];
}

// ─── Available options for each filter ───────────────────────────────────────
export interface Facets {
  subjects: string[];
  itemTypes: string[];
  authors: string[];
  publishers: string[];
  floors: string[];
  racks: number[];
  cols: number[];
}

// ─── Item type display labels ─────────────────────────────────────────────────
export const ITEM_TYPE_LABELS: Record<string, string> = {
  BK:  'Book',
  REF: 'Reference',
  TH:  'Thesis',
  CD:  'CD / DVD',
  TR:  'Technical Report',
  AB:  'Abstract',
  DC:  'Digital Content',
};