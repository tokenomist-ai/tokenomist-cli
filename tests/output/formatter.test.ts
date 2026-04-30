import { describe, it, expect } from "vitest";
import { format } from "../../src/output/formatter.js";
import type { Column } from "../../src/output/table.js";

const columns: Column[] = [
  { key: "name", header: "Name" },
  { key: "value", header: "Value", align: "right" },
];

const data = [
  { name: "Bitcoin", value: 50000 },
  { name: "Ethereum", value: 3000 },
];

describe("format", () => {
  it("outputs JSON", () => {
    const result = format(data, columns, "json");
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(data);
  });

  it("outputs CSV", () => {
    const result = format(data, columns, "csv");
    const lines = result.split("\n");
    expect(lines[0]).toBe("Name,Value");
    expect(lines[1]).toBe("Bitcoin,50000");
    expect(lines[2]).toBe("Ethereum,3000");
  });

  it("outputs table", () => {
    const result = format(data, columns, "table");
    expect(result).toContain("Bitcoin");
    expect(result).toContain("Ethereum");
    expect(result).toContain("Name");
    expect(result).toContain("Value");
  });

  it("handles null values in table", () => {
    const result = format([{ name: "Test", value: null }], columns, "table");
    expect(result).toContain("\u2014");
  });

  it("handles null values in CSV as empty string", () => {
    const result = format([{ name: "Test", value: null }], columns, "csv");
    expect(result).toContain("Test,");
  });
});
