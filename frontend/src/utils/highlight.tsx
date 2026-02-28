// src/utils/highlight.tsx
import React from 'react';

/**
 * Highlight — wraps all occurrences of `query` words inside `text` with
 * a <mark> styled span. Safe: never dangerouslySetInnerHTML.
 *
 * Usage:
 *   <Highlight text="Introduction to JavaScript" query="java" />
 *   → "Introduction to " <mark>Java</mark> "Script"
 */

interface HighlightProps {
  text: string;
  query: string;
  className?: string;             // class for the outer span
  markClassName?: string;         // class for the <mark> span
}

export function Highlight({
  text,
  query,
  className = '',
  markClassName = 'bg-yellow-200 text-yellow-900 rounded px-0.5 font-semibold',
}: HighlightProps) {
  if (!query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  // Build a regex that matches any token from the query (case-insensitive)
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // escape regex chars

  if (!tokens.length) return <span className={className}>{text}</span>;

  const pattern = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts   = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark key={i} className={markClassName}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </span>
  );
}