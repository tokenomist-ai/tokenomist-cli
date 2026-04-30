import { Command } from "commander";
import { TokenomistClient } from "../api/client.js";
import { getDailyEmission, getWeeklyEmission } from "../api/emission.js";
import { output } from "../output/formatter.js";
import type { Column } from "../output/table.js";
import { resolveConfig } from "../config/config.js";

const columns: Column[] = [
  { key: "startDate", header: "Start" },
  { key: "endDate", header: "End" },
  { key: "tokenName", header: "Token" },
  { key: "tokenSymbol", header: "Symbol" },
  { key: "unlockAmount", header: "Unlock Amt", align: "right" },
  { key: "unlockValue", header: "Unlock Val", align: "right" },
  { key: "referencePrice", header: "Ref Price", align: "right" },
  { key: "totalCumulativeUnlockedAmount", header: "Cumulative", align: "right" },
];

export const emissionCommand = new Command("emission").description("Token emission commands");

emissionCommand
  .command("daily <tokenId>")
  .description("Get daily emission breakdown for a token")
  .option("--start <date>", "Start date (YYYY-MM-DD)")
  .option("--end <date>", "End date (YYYY-MM-DD)")
  .option("--standard-allocation <names>", "Filter by allocation (comma-separated)")
  .option("--page <number>", "Page number")
  .option("--page-size <number>", "Items per page")
  .action(async (tokenId: string, opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    const data = await getDailyEmission(client, tokenId, {
      start: opts.start,
      end: opts.end,
      standardAllocation: opts.standardAllocation,
      page: opts.page,
      pageSize: opts.pageSize,
    });
    output(data as unknown as Record<string, unknown>[], columns, globalOpts.output || "table");
  });

emissionCommand
  .command("weekly <tokenId>")
  .description("Get weekly emission breakdown for a token")
  .option("--start <date>", "Start date (YYYY-MM-DD)")
  .option("--end <date>", "End date (YYYY-MM-DD)")
  .option("--standard-allocation <names>", "Filter by allocation (comma-separated)")
  .option("--page <number>", "Page number")
  .option("--page-size <number>", "Items per page")
  .action(async (tokenId: string, opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    const data = await getWeeklyEmission(client, tokenId, {
      start: opts.start,
      end: opts.end,
      standardAllocation: opts.standardAllocation,
      page: opts.page,
      pageSize: opts.pageSize,
    });
    output(data as unknown as Record<string, unknown>[], columns, globalOpts.output || "table");
  });
