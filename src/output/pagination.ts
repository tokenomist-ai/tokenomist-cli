import type { MetaData, Pagination } from "../types/response.js";

/** The page position of a paginated V5 answer, or undefined when it is not paginated. */
export function paginationOf(metadata: MetaData): Pagination | undefined {
  if (metadata.page === undefined || metadata.totalPages === undefined) return undefined;
  return {
    page: metadata.page,
    totalPages: metadata.totalPages,
    pageSize: metadata.pageSize ?? 0,
    // Upstream omits `total` when it is 0.
    total: metadata.total ?? 0,
  };
}

/** One-line page summary, e.g. "Page 1/14 · 28 total · next: --page 2". */
export function formatPaginationHint(p: Pagination): string {
  const parts = [`Page ${p.page}/${p.totalPages}`, `${p.total.toLocaleString()} total`];
  if (p.page < p.totalPages) {
    parts.push(`next: --page ${p.page + 1} (or raise --page-size)`);
  }
  return parts.join(" · ");
}

/**
 * Print the page position to stderr, so stdout (table/json/csv) stays
 * exactly the data and pipes keep working. Silent on non-paginated answers.
 */
export function printPaginationHint(metadata: MetaData, stream = process.stderr): void {
  const p = paginationOf(metadata);
  if (!p) return;
  stream.write(`${formatPaginationHint(p)}\n`);
}
