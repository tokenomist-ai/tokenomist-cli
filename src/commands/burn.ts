import { Command } from "commander";
import { TokenomistClient } from "../api/client.js";
import { listBurns, getBurnDetail } from "../api/burn.js";
import { output } from "../output/formatter.js";
import type { Column } from "../output/table.js";
import { resolveConfig } from "../config/config.js";

const listColumns: Column[] = [
  { key: "tokenId", header: "ID" },
  { key: "tokenName", header: "Name" },
  { key: "tokenSymbol", header: "Symbol" },
  { key: "totalBurnAmount", header: "Total Burned", align: "right" },
];

const detailColumns: Column[] = [
  { key: "burnEventLabel", header: "Label" },
  { key: "burnType", header: "Type" },
  { key: "burnDate", header: "Date" },
  { key: "amount", header: "Amount", align: "right" },
];

export const burnCommand = new Command("burn").description("Token burn commands");

burnCommand
  .command("list")
  .description("List all tokens with burn events")
  .option("--token-id <ids>", "Filter by token IDs (comma-separated)")
  .option("--page <number>", "Page number")
  .option("--page-size <number>", "Items per page")
  .action(async (opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    const data = await listBurns(client, {
      tokenId: opts.tokenId,
      page: opts.page,
      pageSize: opts.pageSize,
    });
    output(data as unknown as Record<string, unknown>[], listColumns, globalOpts.output || "table");
  });

burnCommand
  .command("detail <tokenId>")
  .description("Get burn events for a specific token")
  .option("--start <date>", "Start date (YYYY-MM-DD)")
  .option("--end <date>", "End date (YYYY-MM-DD)")
  .action(async (tokenId: string, opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    const data = await getBurnDetail(client, tokenId, {
      start: opts.start,
      end: opts.end,
    });
    const outputMode = globalOpts.output || "table";
    if (outputMode === "json") {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`Token: ${data.tokenName} (${data.tokenSymbol})`);
      console.log(`Total Burned: ${data.totalBurnAmount.toLocaleString()}`);
      console.log();
      output(data.burns as unknown as Record<string, unknown>[], detailColumns, outputMode);
    }
  });
