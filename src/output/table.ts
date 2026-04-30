import Table from "cli-table3";

export interface Column {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
}

export function renderTable(data: Record<string, unknown>[], columns: Column[]): string {
  const table = new Table({
    head: columns.map((c) => c.header),
    style: { head: ["cyan"] },
    colAligns: columns.map((c) => c.align || "left"),
  });

  for (const row of data) {
    table.push(columns.map((c) => formatValue(row[c.key])));
  }

  return table.toString();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "\u2014";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
