import { Command } from "commander";
import { TokenomistClient } from "../api/client.js";
import {
  getTokenVersions,
  getPointInTimeAllocation,
  getPointInTimeDailyEmission,
  getPointInTimeUnlockEvents,
} from "../api/point-in-time.js";
import { output, type OutputMode } from "../output/formatter.js";
import type { Column } from "../output/table.js";
import { paginationOf, printPaginationHint } from "../output/pagination.js";
import { resolveConfig } from "../config/config.js";
import { validateDateRange, validateVersionSelector } from "./validate.js";
import type { ApiResult } from "../types/response.js";

const versionColumns: Column[] = [
  { key: "historyOrder", header: "#", align: "right" },
  { key: "id", header: "Version ID" },
  { key: "status", header: "Status" },
  { key: "validFrom", header: "Valid From" },
  { key: "validUntil", header: "Valid Until" },
  { key: "changeCategory", header: "Change" },
  { key: "changeTitle", header: "Title" },
];

const allocationColumns: Column[] = [
  { key: "allocationName", header: "Allocation" },
  { key: "allocationType", header: "Type" },
  { key: "standardAllocationName", header: "Std. Allocation" },
  { key: "allocationAmount", header: "Amount", align: "right" },
  { key: "allocationUnlockedAmount", header: "Unlocked", align: "right" },
  { key: "allocationLockedAmount", header: "Locked", align: "right" },
  { key: "trackedAllocationPercentage", header: "Tracked %", align: "right" },
];

const emissionColumns: Column[] = [
  { key: "startDate", header: "Start" },
  { key: "endDate", header: "End" },
  { key: "tokenSymbol", header: "Symbol" },
  { key: "unlockAmount", header: "Unlock Amt", align: "right" },
  { key: "totalCumulativeUnlockedAmount", header: "Cumulative", align: "right" },
  { key: "committedClaimAmount", header: "Committed Claim", align: "right" },
];

const unlockColumns: Column[] = [
  { key: "unlockDate", header: "Date" },
  { key: "tokenSymbol", header: "Symbol" },
  { key: "cliffAmount", header: "Cliff Amount", align: "right" },
  { key: "allocationNames", header: "Allocations" },
];

const STANDARD_ALLOCATION_HELP =
  "Filter by allocation (comma-separated: community, founderTeam, privateInvestors, publicInvestors, others, reserve)";

function addSelectorOptions(cmd: Command): Command {
  return cmd
    .option(
      "--as-of <instant>",
      "Answer as known at this instant (YYYY-MM-DD or RFC 3339, e.g. 2024-07-01T12:00:00Z)",
    )
    .option("--version-id <id>", "Answer from this version (from `tok pit versions`)");
}

function addSeriesOptions(cmd: Command): Command {
  return addSelectorOptions(cmd)
    .option("--start <date>", "Start date (YYYY-MM-DD)")
    .option("--end <date>", "End date (YYYY-MM-DD)")
    .option("--standard-allocation <names>", STANDARD_ALLOCATION_HELP)
    .option("--page <number>", "Page number")
    .option("--page-size <number>", "Items per page");
}

function clientFor(cmd: Command): { client: TokenomistClient; mode: OutputMode } {
  const globalOpts = cmd.optsWithGlobals();
  const config = resolveConfig(globalOpts);
  const client = new TokenomistClient(config.apiKey, config.baseUrl, {
    noCache: config.noCache,
  });
  return { client, mode: (globalOpts.output || "table") as OutputMode };
}

/** JSON output of a point-in-time answer: the data with the version that answered it. */
function printJson<T>(result: ApiResult<T>): void {
  const { metadata, data } = result;
  const pagination = paginationOf(metadata);
  const out: Record<string, unknown> = {};
  if (metadata.asOf !== undefined) out.asOf = metadata.asOf;
  if (metadata.version !== undefined) out.version = metadata.version;
  out.data = data;
  if (pagination) out.pagination = pagination;
  console.log(JSON.stringify(out, null, 2));
}

/**
 * Print which version answered. Table mode writes it to stdout with the
 * table; csv mode to stderr so stdout stays parseable.
 */
function printVersionContext(result: ApiResult<unknown>, mode: OutputMode): void {
  const { asOf, version } = result.metadata;
  if (asOf === undefined && version === undefined) return;
  const lines: string[] = [];
  if (asOf) lines.push(`As of: ${asOf}`);
  if (version) {
    const id = typeof version.id === "string" ? version.id : "—";
    const status = typeof version.status === "string" ? ` (${version.status})` : "";
    lines.push(`Version: ${id}${status}`);
  }
  writeContext(lines, mode);
}

function writeContext(lines: string[], mode: OutputMode): void {
  if (lines.length === 0) return;
  const text = lines.join("\n") + "\n";
  if (mode === "csv") process.stderr.write(text);
  else process.stdout.write(text + "\n");
}

export const pitCommand = new Command("pit")
  .alias("point-in-time")
  .description(
    "Point-in-time history: a token's data as published at a past version (no USD fields)",
  );

pitCommand
  .command("versions <tokenId>")
  .description("List a token's tokenomics versions (project timeline)")
  .option("--start <date>", "Keep versions valid from this day (YYYY-MM-DD)")
  .option("--end <date>", "Keep versions valid from up to this day (YYYY-MM-DD)")
  .option("--page <number>", "Page number")
  .option("--page-size <number>", "Items per page")
  .action(async (tokenId: string, opts, cmd) => {
    validateDateRange(opts.start, opts.end);
    const { client, mode } = clientFor(cmd);
    const result = await getTokenVersions(client, tokenId, {
      start: opts.start,
      end: opts.end,
      page: opts.page,
      pageSize: opts.pageSize,
    });
    if (mode === "json") return printJson(result);
    const rows = result.data.map((v) => ({
      ...v,
      changeCategory: v.change?.category,
      changeTitle: v.change?.title,
    }));
    output(rows as unknown as Record<string, unknown>[], versionColumns, mode);
    printPaginationHint(result.metadata);
  });

addSelectorOptions(
  pitCommand
    .command("allocation <tokenId>")
    .description("Get a token's allocations as published at a version"),
).action(async (tokenId: string, opts, cmd) => {
  validateVersionSelector(opts.asOf, opts.versionId);
  const { client, mode } = clientFor(cmd);
  const result = await getPointInTimeAllocation(client, tokenId, {
    asOf: opts.asOf,
    versionId: opts.versionId,
  });
  if (mode === "json") return printJson(result);
  const d = result.data;
  printVersionContext(result, mode);
  writeContext(
    [
      `Token: ${d.name} (${d.symbol})`,
      `Max Supply: ${d.maxSupply?.toLocaleString() ?? "—"}`,
      `Total Unlocked: ${d.totalUnlockedAmount.toLocaleString()}`,
      `Total Locked: ${d.totalLockedAmount.toLocaleString()}`,
      `Total TBD Locked: ${d.totalTBDLockedAmount.toLocaleString()}`,
      `Total Untracked: ${d.totalUntrackedAmount.toLocaleString()}`,
    ],
    mode,
  );
  output(d.allocations as unknown as Record<string, unknown>[], allocationColumns, mode);
});

addSeriesOptions(
  pitCommand
    .command("daily-emission <tokenId>")
    .description("Get a token's daily emission (cliff + linear) as published at a version"),
).action(async (tokenId: string, opts, cmd) => {
  validateVersionSelector(opts.asOf, opts.versionId);
  validateDateRange(opts.start, opts.end);
  const { client, mode } = clientFor(cmd);
  const result = await getPointInTimeDailyEmission(client, tokenId, {
    asOf: opts.asOf,
    versionId: opts.versionId,
    start: opts.start,
    end: opts.end,
    standardAllocation: opts.standardAllocation,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  if (mode === "json") return printJson(result);
  printVersionContext(result, mode);
  const rows = result.data.map((d) => ({
    ...d,
    committedClaimAmount: d.committedClaim?.amount ?? null,
  }));
  output(rows as unknown as Record<string, unknown>[], emissionColumns, mode);
  printPaginationHint(result.metadata);
});

addSeriesOptions(
  pitCommand
    .command("unlock-events <tokenId>")
    .description("Get a token's cliff unlock events as published at a version"),
).action(async (tokenId: string, opts, cmd) => {
  validateVersionSelector(opts.asOf, opts.versionId);
  validateDateRange(opts.start, opts.end);
  const { client, mode } = clientFor(cmd);
  const result = await getPointInTimeUnlockEvents(client, tokenId, {
    asOf: opts.asOf,
    versionId: opts.versionId,
    start: opts.start,
    end: opts.end,
    standardAllocation: opts.standardAllocation,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  if (mode === "json") return printJson(result);
  printVersionContext(result, mode);
  const rows = result.data.map((e) => ({
    ...e,
    cliffAmount: e.cliffUnlocks.cliffAmount,
    allocationNames: e.cliffUnlocks.allocationBreakdown.map((a) => a.allocationName),
  }));
  output(rows as unknown as Record<string, unknown>[], unlockColumns, mode);
  printPaginationHint(result.metadata);
});
