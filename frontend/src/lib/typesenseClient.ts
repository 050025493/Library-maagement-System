// src/lib/typesenseClient.ts
import Typesense from "typesense";

/**
 * Typesense client for the frontend.
 *
 * Add to your .env:
 *   VITE_TYPESENSE_HOST=localhost           (or your cloud host)
 *   VITE_TYPESENSE_PORT=8108
 *   VITE_TYPESENSE_PROTOCOL=http
 *   VITE_TYPESENSE_SEARCH_KEY=your_search_only_key
 *
 * The SEARCH_KEY is safe to expose in the browser — it's read-only.
 */
export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host:     import.meta.env.VITE_TYPESENSE_HOST     ?? "localhost",
      port:     parseInt(import.meta.env.VITE_TYPESENSE_PORT ?? "8108"),
      protocol: (import.meta.env.VITE_TYPESENSE_PROTOCOL ?? "http") as "http" | "https",
    },
  ],
  apiKey:                   import.meta.env.VITE_TYPESENSE_SEARCH_KEY ?? "xyz",
  connectionTimeoutSeconds: 5,
  retryIntervalSeconds:     0.1,
  numRetries:               2,
});

export const BOOKS_COLLECTION = "books";