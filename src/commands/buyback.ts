import { Command } from "commander";
import { TokenomistClient } from "../api/client.js";
import { listBuybacks, getBuybackDetail } from "../api/buyback.js";
import { output } from "../output/formatter.js";
import type { Column } from "../output/table.js";
import { resolveConfig } from "../config/config.js";
import { printPaginationHint } from "../output/pagination.js";
import { validateDateRange } from "./validate.js";

const listColumns: Column[] = [
  { key: "tokenId", header: "ID" },
  { key: "tokenName", header: "Name" },
  { key: "tokenSymbol", header: "Symbol" },
  { key: "totalBuybackAmount", header: "Total Buyback", align: "right" },
  { key: "totalBuybackValue", header: "Total Value (USD)", align: "right" },
];

const detailColumns: Column[] = [
  { key: "buybackEventLabel", header: "Label" },
  { key: "buybackType", header: "Type" },
  { key: "buybackDate", header: "Date" },
  { key: "tokenAmount", header: "Amount", align: "right" },
  { key: "value", header: "Value", align: "right" },
  { key: "spentAmount", header: "Spent", align: "right" },
  { key: "spentUnit", header: "Unit" },
  // Added in 0.2.0 — appended so 0.1.x CSV columns keep their positions.
  { key: "pricePerToken", header: "Price", align: "right" },
];

export const buybackCommand = new Command("buyback").description("Token buyback commands");

buybackCommand
  .command("list")
  .description("List all tokens with buyback events")
  .option("--token-id <ids>", "Filter by token IDs (comma-separated)")
  .option("--page <number>", "Page number")
  .option("--page-size <number>", "Items per page")
  .action(async (opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    const { data, metadata } = await listBuybacks(client, {
      tokenId: opts.tokenId,
      page: opts.page,
      pageSize: opts.pageSize,
    });
    output(data as unknown as Record<string, unknown>[], listColumns, globalOpts.output || "table");
    printPaginationHint(metadata);
  });

buybackCommand
  .command("detail <tokenId>")
  .description("Get buyback events for a specific token")
  .option("--start <date>", "Start date (YYYY-MM-DD)")
  .option("--end <date>", "End date (YYYY-MM-DD)")
  .action(async (tokenId: string, opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    validateDateRange(opts.start, opts.end);
    const data = await getBuybackDetail(client, tokenId, {
      start: opts.start,
      end: opts.end,
    });
    const outputMode = globalOpts.output || "table";
    if (outputMode === "json") {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`Token: ${data.tokenName} (${data.tokenSymbol})`);
      console.log(`Total Buyback: ${data.totalBuybackAmount.toLocaleString()}`);
      // Table only: CSV stdout keeps its 0.1.x preamble.
      if (outputMode === "table") {
        console.log(`Total Value (USD): ${data.totalBuybackValue?.toLocaleString() ?? "\u2014"}`);
      }
      console.log();
      output(data.buybacks as unknown as Record<string, unknown>[], detailColumns, outputMode);
    }
  });
