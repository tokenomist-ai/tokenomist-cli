import { Command } from "commander";
import { TokenomistClient } from "../api/client.js";
import { getFundraising } from "../api/fundraising.js";
import { output } from "../output/formatter.js";
import type { Column } from "../output/table.js";
import { resolveConfig } from "../config/config.js";

const columns: Column[] = [
  { key: "fundingRound", header: "Round" },
  { key: "fundingDate", header: "Date" },
  { key: "raiseType", header: "Type" },
  { key: "amountRaised", header: "Raised", align: "right" },
  { key: "valuation", header: "Valuation", align: "right" },
  { key: "pricePerToken", header: "Price/Token", align: "right" },
  { key: "numberOfInvestors", header: "Investors", align: "right" },
];

export const fundraisingCommand = new Command("fundraising").description(
  "Token fundraising commands",
);

fundraisingCommand
  .command("detail <tokenId>")
  .description("Get fundraising data for a specific token")
  .option("--funding-date-min <date>", "Min funding date (YYYY-MM-DD)")
  .option("--funding-date-max <date>", "Max funding date (YYYY-MM-DD)")
  .option("--raised-amount-min <value>", "Min raised amount")
  .option("--raised-amount-max <value>", "Max raised amount")
  .action(async (tokenId: string, opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    const data = await getFundraising(client, tokenId, {
      fundingDateMin: opts.fundingDateMin,
      fundingDateMax: opts.fundingDateMax,
      raisedAmountMin: opts.raisedAmountMin,
      raisedAmountMax: opts.raisedAmountMax,
    });
    const outputMode = globalOpts.output || "table";
    if (outputMode === "json") {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`Token: ${data.tokenName} (${data.tokenSymbol})`);
      console.log(`Total Raised: ${data.totalAmountRaised ?? "\u2014"}`);
      console.log(`Investor Released: ${data.investorReleasedPercentage ?? "\u2014"}%`);
      console.log();
      output(data.fundingRounds as unknown as Record<string, unknown>[], columns, outputMode);
    }
  });
