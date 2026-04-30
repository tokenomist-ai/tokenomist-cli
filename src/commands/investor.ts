import { Command } from "commander";
import { TokenomistClient } from "../api/client.js";
import { listInvestors, getInvestorDetail } from "../api/investor.js";
import { output } from "../output/formatter.js";
import type { Column } from "../output/table.js";
import { resolveConfig } from "../config/config.js";

const listColumns: Column[] = [
  { key: "investorId", header: "ID" },
  { key: "investorName", header: "Name" },
  { key: "website", header: "Website" },
  { key: "latestFundingDate", header: "Latest Funding" },
  { key: "latestFundingRound", header: "Latest Round" },
  { key: "roundCount", header: "Rounds", align: "right" },
];

const detailColumns: Column[] = [
  { key: "tokenId", header: "Token ID" },
  { key: "roundName", header: "Round" },
  { key: "isLeadInvestor", header: "Lead?" },
  { key: "fundingDate", header: "Date" },
  { key: "totalAmountRaisedinThatRound", header: "Raised", align: "right" },
  { key: "valuation", header: "Valuation", align: "right" },
  { key: "pricePerToken", header: "Price/Token", align: "right" },
];

export const investorCommand = new Command("investor").description("Investor commands");

investorCommand
  .command("list")
  .description("List all investors with their funding rounds")
  .option("--start-latest-funding-date <date>", "Start date filter for latest funding (YYYY-MM-DD)")
  .option("--end-latest-funding-date <date>", "End date filter for latest funding (YYYY-MM-DD)")
  .option("--page <number>", "Page number")
  .option("--page-size <number>", "Items per page")
  .action(async (opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    const data = await listInvestors(client, {
      startLatestFundingDate: opts.startLatestFundingDate,
      endLatestFundingDate: opts.endLatestFundingDate,
      page: opts.page,
      pageSize: opts.pageSize,
    });
    const rows = data.map((d) => ({
      ...d,
      roundCount: d.fundingRounds?.length || 0,
    }));
    output(rows as unknown as Record<string, unknown>[], listColumns, globalOpts.output || "table");
  });

investorCommand
  .command("detail <investorId>")
  .description("Get investor detail with funding rounds")
  .option("--is-lead-investor", "Filter by lead investor status")
  .option("--funding-date-min <date>", "Min funding date (YYYY-MM-DD)")
  .option("--funding-date-max <date>", "Max funding date (YYYY-MM-DD)")
  .option("--raised-amount-min <value>", "Min raised amount")
  .option("--raised-amount-max <value>", "Max raised amount")
  .action(async (investorId: string, opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals();
    const config = resolveConfig(globalOpts);
    const client = new TokenomistClient(config.apiKey, config.baseUrl, {
      noCache: config.noCache,
    });
    const data = await getInvestorDetail(client, investorId, {
      isLeadInvestor: opts.isLeadInvestor ? "true" : undefined,
      fundingDateMin: opts.fundingDateMin,
      fundingDateMax: opts.fundingDateMax,
      raisedAmountMin: opts.raisedAmountMin,
      raisedAmountMax: opts.raisedAmountMax,
    });
    const outputMode = globalOpts.output || "table";
    if (outputMode === "json") {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`Investor: ${data.investorName}`);
      console.log(`Website: ${data.website}`);
      console.log(`Latest Funding: ${data.latestFundingDate}`);
      console.log();
      output(data.fundingRounds as unknown as Record<string, unknown>[], detailColumns, outputMode);
    }
  });
