import { Command } from "commander";
import { TokenomistClient } from "../api/client.js";
import { listTokens, searchTokens } from "../api/token.js";
import { output } from "../output/formatter.js";
import type { Column } from "../output/table.js";
import { resolveConfig } from "../config/config.js";

const columns: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "symbol", header: "Symbol" },
  { key: "marketCap", header: "Market Cap", align: "right" },
  { key: "circulatingSupply", header: "Circ. Supply", align: "right" },
  { key: "totalLockedAmount", header: "Locked", align: "right" },
  { key: "unlockedAmount", header: "Unlocked", align: "right" },
  { key: "lastUpdatedDate", header: "Updated" },
];

const searchColumns: Column[] = [
  { key: "tokenId", header: "ID" },
  { key: "tokenName", header: "Name" },
  { key: "tokenSymbol", header: "Symbol" },
];

export const tokenCommand = new Command("token").description("Token commands");

tokenCommand
  .command("list")
  .description("List all tokens with summary data")
  .option("--token-id <ids>", "Filter by token IDs (comma-separated)")
  .action(async (opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    const data = await listTokens(client, {
      tokenId: opts.tokenId,
    });
    output(data as unknown as Record<string, unknown>[], columns, globalOpts.output || "table");
  });

tokenCommand
  .command("search <query>")
  .description("Search for tokens by name, symbol, or ID")
  .action(async (query: string, _opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    const data = await searchTokens(client, query);
    output(
      data as unknown as Record<string, unknown>[],
      searchColumns,
      globalOpts.output || "table",
    );
  });
