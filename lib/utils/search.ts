/**
 * Fuzzy search for parts - matches name, manufacturer, brand
 */

export interface SearchablePart {
  id: string;
  name: string;
  manufacturer: string;
  [key: string]: unknown;
}

/**
 * Simple fuzzy match: all query terms must appear (in order) in the text
 */
function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return true;

  let idx = 0;
  for (const term of terms) {
    const found = t.indexOf(term, idx);
    if (found === -1) return false;
    idx = found + term.length;
  }
  return true;
}

/**
 * Build searchable text: name, manufacturer, and optional model/brand
 */
function searchText(part: SearchablePart): string {
  const p = part as SearchablePart & { model?: string; specs?: { brand?: string } };
  const extra = [p.model, p.specs?.brand].filter(Boolean).join(" ");
  return `${part.name} ${part.manufacturer} ${extra}`.trim();
}

/**
 * Score for ranking: exact matches rank higher
 */
function scoreMatch(part: SearchablePart, query: string): number {
  const q = query.toLowerCase();
  const searchStr = searchText(part).toLowerCase();
  if (searchStr.includes(q)) return 100;
  if (fuzzyMatch(searchStr, query)) return 80;
  return 0;
}

export type SortOption = "name" | "price" | "tier";

/**
 * Search and sort parts
 */
export function searchParts<T extends SearchablePart>(
  parts: T[],
  query: string,
  sort: SortOption = "name"
): T[] {
  const q = query.trim();
  const result = q
    ? parts.filter((p) => fuzzyMatch(searchText(p), q))
    : [...parts];

  // Sort
  result.sort((a, b) => {
    if (sort === "price") {
      const pa = (a as SearchablePart & { price_usd?: number }).price_usd ?? Infinity;
      const pb = (b as SearchablePart & { price_usd?: number }).price_usd ?? Infinity;
      return pa - pb;
    }
    if (sort === "tier") {
      const ta = (a as SearchablePart & { specs?: { tier?: number } }).specs?.tier ?? 0;
      const tb = (b as SearchablePart & { specs?: { tier?: number } }).specs?.tier ?? 0;
      return tb - ta; // Higher tier first
    }
    return (a.name || "").localeCompare(b.name || "");
  });

  // If query provided, re-rank by match score
  if (q) {
    result.sort((a, b) => scoreMatch(b, q) - scoreMatch(a, q));
  }

  return result;
}
