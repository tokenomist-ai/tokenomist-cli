import { describe, it, expect } from "vitest";
import { validateDateRange, validateVersionSelector } from "../../src/commands/validate.js";

describe("validateDateRange", () => {
  it("accepts open or ordered ranges", () => {
    expect(() => validateDateRange(undefined, undefined)).not.toThrow();
    expect(() => validateDateRange("2026-01-01", undefined)).not.toThrow();
    expect(() => validateDateRange("2026-01-01", "2026-01-01")).not.toThrow();
    expect(() => validateDateRange("2026-01-01", "2026-02-01")).not.toThrow();
  });

  it("rejects start after end, naming the flags", () => {
    expect(() => validateDateRange("2026-02-01", "2026-01-01")).toThrow(
      "--start 2026-02-01 is after --end 2026-01-01",
    );
    expect(() =>
      validateDateRange("2026-02-01", "2026-01-01", ["--min-unlock-date", "--max-unlock-date"]),
    ).toThrow("--min-unlock-date 2026-02-01 is after --max-unlock-date 2026-01-01");
  });
});

describe("validateVersionSelector", () => {
  it("accepts one selector or none", () => {
    expect(() => validateVersionSelector(undefined, undefined)).not.toThrow();
    expect(() => validateVersionSelector("2025-01-01", undefined)).not.toThrow();
    expect(() => validateVersionSelector(undefined, "arbitrum-p-1")).not.toThrow();
  });

  it("rejects both", () => {
    expect(() => validateVersionSelector("2025-01-01", "arbitrum-p-1")).toThrow(
      "Use either --as-of or --version-id, not both",
    );
  });
});
