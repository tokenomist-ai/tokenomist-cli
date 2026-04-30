import type { Column } from "./table.js";

export function renderCsv(data: Record<string, unknown>[], columns: Column[]): string {
  const header = columns.map((c) => escapeCsv(c.header)).join(",");
  const rows = data.map((row) =>
    columns.map((c) => escapeCsv(formatCsvValue(row[c.key]))).join(","),
  );
  return [header, ...rows].join("\n");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}
