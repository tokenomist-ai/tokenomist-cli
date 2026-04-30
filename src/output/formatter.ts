import type { Column } from "./table.js";
import { renderTable } from "./table.js";
import { renderCsv } from "./csv.js";

export type OutputMode = "table" | "json" | "csv";

export function format(
  data: Record<string, unknown>[],
  columns: Column[],
  mode: OutputMode,
): string {
  switch (mode) {
    case "json":
      return JSON.stringify(data, null, 2);
    case "csv":
      return renderCsv(data, columns);
    case "table":
    default:
      return renderTable(data, columns);
  }
}

export function output(data: Record<string, unknown>[], columns: Column[], mode: OutputMode): void {
  console.log(format(data, columns, mode));
}
