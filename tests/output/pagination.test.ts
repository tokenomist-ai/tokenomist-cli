import { describe, it, expect } from "vitest";
import {
  paginationOf,
  formatPaginationHint,
  printPaginationHint,
} from "../../src/output/pagination.js";

describe("paginationOf", () => {
  it("returns undefined for a non-paginated answer", () => {
    expect(paginationOf({ queryDate: "2026-11-04T00:00:00Z" })).toBeUndefined();
  });

  it("defaults an omitted total to 0", () => {
    expect(paginationOf({ page: 1, totalPages: 1, pageSize: 20 })).toEqual({
      page: 1,
      totalPages: 1,
      pageSize: 20,
      total: 0,
    });
  });
});

describe("formatPaginationHint", () => {
  it("names the next page when there is one", () => {
    expect(formatPaginationHint({ page: 1, totalPages: 14, pageSize: 2, total: 28 })).toBe(
      "Page 1/14 · 28 total · next: --page 2 (or raise --page-size)",
    );
  });

  it("omits next on the last page", () => {
    expect(formatPaginationHint({ page: 3, totalPages: 3, pageSize: 20, total: 56 })).toBe(
      "Page 3/3 · 56 total",
    );
  });
});

describe("printPaginationHint", () => {
  it("writes nothing for a non-paginated answer", () => {
    const chunks: string[] = [];
    printPaginationHint({}, { write: (c: string) => chunks.push(c) } as never);
    expect(chunks).toEqual([]);
  });

  it("writes one line for a paginated answer", () => {
    const chunks: string[] = [];
    printPaginationHint({ page: 1, totalPages: 1, pageSize: 20, total: 3 }, {
      write: (c: string) => chunks.push(c),
    } as never);
    expect(chunks).toEqual(["Page 1/1 · 3 total\n"]);
  });
});
