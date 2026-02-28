/**
 * sync-to-typesense.ts
 *
 * Bulk-syncs the Supabase `books` table → Typesense.
 *
 * Usage:
 *   npx tsx scripts/sync-to-typesense.ts
 *
 * Environment variables required:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY  (or service role key)
 *   TYPESENSE_HOST, TYPESENSE_PORT, TYPESENSE_PROTOCOL, TYPESENSE_API_KEY
 */
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(scriptDir, ".env") });
config({ path: resolve(process.cwd(), ".env"), override: false });
config({ path: resolve(process.cwd(), "frontend/.env"), override: false });
import { createClient } from "@supabase/supabase-js";
import Typesense from "typesense";

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing Supabase env vars. Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in scripts/.env, .env, or frontend/.env"
  );
}

const TYPESENSE_CONFIG = {
  nodes: [
    {
      host: process.env.TYPESENSE_HOST ?? "localhost",
      port: parseInt(process.env.TYPESENSE_PORT ?? "8108"),
      protocol: (process.env.TYPESENSE_PROTOCOL ?? "http") as
        | "http"
        | "https",
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY ?? "xyz", // use a strong key in prod
  connectionTimeoutSeconds: 10,
};

const COLLECTION_NAME = "books";
const BATCH_SIZE = 500; // Typesense handles 500-row batches well

// ─── Typesense schema ─────────────────────────────────────────────────────────
import type { CollectionCreateSchema } from "typesense/lib/Typesense/Collections";

const SCHEMA: CollectionCreateSchema = {
  name: COLLECTION_NAME,
  fields: [
    // ── Searchable text fields ──────────────────────────────────────────────
    { name: "title",            type: "string",   facet: false },
    { name: "subtitle",         type: "string",   facet: false, optional: true },
    { name: "author",           type: "string",   facet: true,  optional: true },
    { name: "publisher",        type: "string",   facet: true,  optional: true },
    { name: "subject",          type: "string",   facet: true,  optional: true },
    { name: "isbn",             type: "string",   facet: false, optional: true },
    { name: "dewey_class",      type: "string",   facet: false, optional: true },

    // ── Filterable / sortable fields ────────────────────────────────────────
    { name: "pub_year",         type: "int32",    facet: true,  optional: true },
    { name: "item_types",       type: "string[]", facet: true,  optional: true },
    { name: "status",           type: "string",   facet: true  },
    { name: "available_copies", type: "int32",    facet: false },
    { name: "copy_count",       type: "int32",    facet: false },

    // ── Shelf / location ────────────────────────────────────────────────────
    { name: "shelf",            type: "string",   facet: false, optional: true },
    { name: "call_number",      type: "string",   facet: false, optional: true },
    { name: "floor",            type: "string",   facet: true,  optional: true },
    { name: "rack",             type: "int32",    facet: true,  optional: true },
    { name: "col",              type: "int32",    facet: true,  optional: true },

    // ── Popularity signal ───────────────────────────────────────────────────
    { name: "total_checkouts",  type: "int32"    },

    // ── Raw Supabase row ids (for fetching all copies later) ────────────────
    { name: "row_ids",          type: "string[]", optional: true },

    // ── Edition ─────────────────────────────────────────────────────────────
    { name: "edition",          type: "string",   facet: false, optional: true },
  ],
  // Use total_checkouts as the default sort signal for popularity boosting
  default_sorting_field: "total_checkouts",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
type Row = {
  id: number;
  title: string;
  subtitle?: string | null;
  author?: string | null;
  publisher?: string | null;
  pub_year?: string | null;
  subject?: string | null;
  isbn?: string | null;
  dewey_class?: string | null;
  item_type?: string | null;
  shelf?: string | null;
  call_number?: string | null;
  edition?: string | null;
  barcode?: string | null;
  date_due?: string | null;
  not_for_loan?: string | null;
  lost_status?: string | null;
  total_checkouts?: number | null;
};

const FLOOR_MAP: Record<string, string> = {
  GD: "Ground Floor",
  IF: "1st Floor",
  IIF: "2nd Floor",
  IIIF: "3rd Floor",
  STACK: "General Stack",
};

function parseShelf(shelfStr: string | null | undefined) {
  if (!shelfStr) return null;
  const m = shelfStr.trim().match(/^([A-Z]+)-R(\d+)-C(\d+)-([A-Z0-9]+)$/);
  if (!m) return null;
  return {
    floor: FLOOR_MAP[m[1]] ?? m[1],
    rack: parseInt(m[2], 10),
    col: parseInt(m[3], 10),
  };
}

function getStatus(row: Row): string {
  if (!row.barcode?.trim()) return "Not Available";
  if (row.lost_status?.trim() === "1") return "Lost";
  if (row.not_for_loan?.trim() === "1") return "Reference Only";
  if (row.date_due?.trim()) return "Checked Out";
  return "Available";
}

// Status priority for choosing "best" status per group
const STATUS_PRIORITY: Record<string, number> = {
  Available: 0,
  "Checked Out": 1,
  "Reference Only": 2,
  Lost: 3,
  "Not Available": 4,
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const typesense = new Typesense.Client(TYPESENSE_CONFIG);

  // ── 1. Drop + recreate the collection ──────────────────────────────────────
  console.log("🗑  Dropping old collection (if exists)…");
  try {
    await typesense.collections(COLLECTION_NAME).delete();
  } catch {
    // doesn't exist yet
  }
  console.log("📐 Creating collection schema…");
  await typesense.collections().create(SCHEMA);

  // ── 2. Stream all rows from Supabase ───────────────────────────────────────
  console.log("📥 Fetching all rows from Supabase…");
  let from = 0;
  const PAGE = 1000;
  const allRows: Row[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .range(from, from + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows.push(...(data as Row[]));
    from += PAGE;
    process.stdout.write(`\r  Fetched ${allRows.length} rows…`);
  }
  console.log(`\n✅ Fetched ${allRows.length} total rows`);

  // ── 3. Group rows by title → one Typesense doc per unique title ────────────
  console.log("🔀 Grouping into title-level documents…");
  const groups = new Map<string, Row[]>();

  for (const row of allRows) {
    const key = (row.title ?? "UNKNOWN").trim().toUpperCase();
    const arr = groups.get(key);
    if (arr) arr.push(row);
    else groups.set(key, [row]);
  }

  // ── 4. Convert to Typesense documents ──────────────────────────────────────
  const docs: Record<string, unknown>[] = [];

  for (const [, rows] of groups) {
    const best = rows[0]; // assume already sorted (or just pick first)

    const statuses = rows.map(getStatus);
    let groupStatus = "Not Available";
    for (const s of Object.keys(STATUS_PRIORITY)) {
      if (statuses.includes(s)) {
        groupStatus = s;
        break;
      }
    }

    const availableCopies = statuses.filter((s) => s === "Available").length;
    const totalCheckouts = rows.reduce(
      (sum, r) => sum + (r.total_checkouts ?? 0),
      0
    );

    const itemTypes = [...new Set(rows.map((r) => r.item_type).filter(Boolean))] as string[];

    const loc = parseShelf(best.shelf);

    const pubYear = best.pub_year ? parseInt(best.pub_year, 10) : undefined;

    docs.push({
      // Typesense requires `id` as a string
      id: (best.id ?? Math.random()).toString(),

      title:          best.title ?? "",
      subtitle:       best.subtitle ?? undefined,
      author:         best.author ?? undefined,
      publisher:      best.publisher ?? undefined,
      pub_year:       isNaN(pubYear as number) ? undefined : pubYear,
      subject:        best.subject ?? undefined,
      isbn:           best.isbn ?? undefined,
      dewey_class:    best.dewey_class ?? undefined,
      item_types:     itemTypes.length > 0 ? itemTypes : undefined,
      edition:        best.edition ?? undefined,

      shelf:          best.shelf ?? undefined,
      call_number:    best.call_number ?? undefined,
      floor:          loc?.floor ?? undefined,
      rack:           loc?.rack ?? undefined,
      col:            loc?.col ?? undefined,

      status:           groupStatus,
      available_copies: availableCopies,
      copy_count:       rows.length,
      total_checkouts:  totalCheckouts,

      // Store all Supabase row IDs so the frontend can fetch full copy details
      row_ids: rows.map((r) => r.id.toString()),
    });
  }

  console.log(`📦 ${docs.length} unique titles to index`);

  // ── 5. Batch-import into Typesense ─────────────────────────────────────────
  console.log("⬆️  Importing into Typesense…");
  let imported = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    const results = await typesense
      .collections(COLLECTION_NAME)
      .documents()
      .import(batch, { action: "create" });

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      console.warn(`⚠  ${failed.length} docs failed in batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      console.warn(failed.slice(0, 3)); // show first 3 failures
    }

    imported += batch.length - failed.length;
    process.stdout.write(`\r  Indexed ${imported} / ${docs.length}…`);
  }

  console.log(`\n🎉 Done! ${imported} documents indexed in Typesense.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});