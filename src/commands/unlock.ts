import { Command } from "commander";
import { TokenomistClient } from "../api/client.js";
import { listUnlockEvents, listUpcomingUnlockEvents, getUnlockEvents } from "../api/unlock.js";
import { output } from "../output/formatter.js";
import type { Column } from "../output/table.js";
import { resolveConfig } from "../config/config.js";

const listColumns: Column[] = [
  { key: "tokenName", header: "Token" },
  { key: "tokenSymbol", header: "Symbol" },
  { key: "marketCap", header: "Market Cap", align: "right" },
  { key: "releasedPercentage", header: "Released %", align: "right" },
  { key: "eventCount", header: "Events", align: "right" },
];

const upcomingColumns: Column[] = [
  { key: "tokenName", header: "Token" },
  { key: "tokenSymbol", header: "Symbol" },
  { key: "marketCap", header: "Market Cap", align: "right" },
  { key: "unlockDate", header: "Unlock Date" },
  { key: "totalCliffAmount", header: "Cliff Amount", align: "right" },
  { key: "totalCliffValue", header: "Cliff Value", align: "right" },
];

const eventsColumns: Column[] = [
  { key: "unlockDate", header: "Date" },
  { key: "tokenName", header: "Token" },
  { key: "tokenSymbol", header: "Symbol" },
  { key: "cliffAmount", header: "Amount", align: "right" },
  { key: "cliffValue", header: "Value", align: "right" },
  { key: "valueToMarketCap", header: "Val/MCap", align: "right" },
];

function addPaginationOptions(cmd: Command): Command {
  return cmd
    .option("--page <number>", "Page number")
    .option("--page-size <number>", "Items per page");
}

function addListFilterOptions(cmd: Command): Command {
  return addPaginationOptions(
    cmd
      .option("--min-market-cap <value>", "Minimum market cap")
      .option("--min-released-percentage <value>", "Minimum released percentage")
      .option("--min-unlock-date <date>", "Min unlock date (YYYY-MM-DD)")
      .option("--max-unlock-date <date>", "Max unlock date (YYYY-MM-DD)")
      .option("--min-total-unlock-amount <value>", "Minimum total unlock amount")
      .option("--min-value-to-market-cap <value>", "Min value-to-market-cap ratio")
      .option("--standard-allocation <names>", "Filter by allocation (comma-separated)"),
  );
}

function addUpcomingFilterOptions(cmd: Command): Command {
  return addPaginationOptions(
    cmd
      .option("--start <date>", "Start date (YYYY-MM-DD)")
      .option("--end <date>", "End date (YYYY-MM-DD)")
      .option("--standard-allocation <names>", "Filter by allocation (comma-separated)")
      .option("--min-market-cap <value>", "Minimum market cap")
      .option("--min-released-percentage <value>", "Minimum released percentage")
      .option("--min-total-unlock-amount <value>", "Minimum total unlock amount")
      .option("--min-value-to-market-cap <value>", "Min value-to-market-cap ratio"),
  );
}

export const unlockCommand = new Command("unlock").description("Token unlock event commands");

addListFilterOptions(
  unlockCommand.command("list").description("List unlock events grouped by token"),
).action(async (opts, cmd) => {
  const globalOpts = cmd.optsWithGlobals();
  const config = resolveConfig(globalOpts);
  const client = new TokenomistClient(config.apiKey, config.baseUrl, {
    noCache: config.noCache,
  });
  const data = await listUnlockEvents(client, {
    minMarketCap: opts.minMarketCap,
    minReleasedPercentage: opts.minReleasedPercentage,
    minUnlockDate: opts.minUnlockDate,
    maxUnlockDate: opts.maxUnlockDate,
    minTotalUnlockAmount: opts.minTotalUnlockAmount,
    minValueToMarketCap: opts.minValueToMarketCap,
    standardAllocation: opts.standardAllocation,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  const rows = data.map((d) => ({
    ...d,
    eventCount: d.events.length,
  }));
  output(rows as unknown as Record<string, unknown>[], listColumns, globalOpts.output || "table");
});

addUpcomingFilterOptions(
  unlockCommand.command("upcoming").description("List next upcoming unlock event per token"),
).action(async (opts, cmd) => {
  const globalOpts = cmd.optsWithGlobals();
  const config = resolveConfig(globalOpts);
  const client = new TokenomistClient(config.apiKey, config.baseUrl, {
    noCache: config.noCache,
  });
  const data = await listUpcomingUnlockEvents(client, {
    start: opts.start,
    end: opts.end,
    standardAllocation: opts.standardAllocation,
    minMarketCap: opts.minMarketCap,
    minReleasedPercentage: opts.minReleasedPercentage,
    minTotalUnlockAmount: opts.minTotalUnlockAmount,
    minValueToMarketCap: opts.minValueToMarketCap,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  const rows = data.map((d) => ({
    ...d,
    unlockDate: d.upcomingEvent.unlockDate,
    totalCliffAmount: d.upcomingEvent.cliffUnlocks.totalCliffAmount,
    totalCliffValue: d.upcomingEvent.cliffUnlocks.totalCliffValue,
  }));
  output(
    rows as unknown as Record<string, unknown>[],
    upcomingColumns,
    globalOpts.output || "table",
  );
});

addPaginationOptions(
  unlockCommand
    .command("events <tokenId>")
    .description("Get unlock events for a specific token")
    .option("--start <date>", "Start date (YYYY-MM-DD)")
    .option("--end <date>", "End date (YYYY-MM-DD)")
    .option("--standard-allocation <names>", "Filter by allocation (comma-separated)"),
).action(async (tokenId: string, opts, cmd) => {
  const globalOpts = cmd.optsWithGlobals();
  const config = resolveConfig(globalOpts);
  const client = new TokenomistClient(config.apiKey, config.baseUrl, {
    noCache: config.noCache,
  });
  const data = await getUnlockEvents(client, tokenId, {
    start: opts.start,
    end: opts.end,
    standardAllocation: opts.standardAllocation,
    page: opts.page,
    pageSize: opts.pageSize,
  });
  const rows = data.map((d) => ({
    ...d,
    cliffAmount: d.cliffUnlocks.cliffAmount,
    cliffValue: d.cliffUnlocks.cliffValue,
    valueToMarketCap: d.cliffUnlocks.valueToMarketCap,
  }));
  output(rows as unknown as Record<string, unknown>[], eventsColumns, globalOpts.output || "table");
});
