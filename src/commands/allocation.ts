import { Command } from "commander";
import { TokenomistClient } from "../api/client.js";
import { getAllocation } from "../api/allocation.js";
import { output } from "../output/formatter.js";
import type { Column } from "../output/table.js";
import { resolveConfig } from "../config/config.js";

const columns: Column[] = [
  { key: "allocationName", header: "Allocation" },
  { key: "allocationType", header: "Type" },
  { key: "standardAllocationName", header: "Std. Allocation" },
  { key: "allocationAmount", header: "Amount", align: "right" },
  { key: "allocationUnlockedAmount", header: "Unlocked", align: "right" },
  { key: "allocationLockedAmount", header: "Locked", align: "right" },
  { key: "trackedAllocationPercentage", header: "Tracked %", align: "right" },
];

export const allocationCommand = new Command("allocation").description("Token allocation commands");

allocationCommand
  .command("detail <tokenId>")
  .description("Get standard allocation data for a specific token")
  .action(async (tokenId: string, _opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    const data = await getAllocation(client, tokenId);
    const outputMode = globalOpts.output || "table";
    if (outputMode === "json") {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`Token: ${data.name} (${data.symbol})`);
      console.log(`Max Supply: ${data.maxSupply?.toLocaleString() ?? "\u2014"}`);
      console.log(`Total Unlocked: ${data.totalUnlockedAmount.toLocaleString()}`);
      console.log(`Total Locked: ${data.totalLockedAmount.toLocaleString()}`);
      console.log(`Last Updated: ${data.lastUpdatedDate}`);
      console.log();
      output(data.allocations as unknown as Record<string, unknown>[], columns, outputMode);
    }
  });
