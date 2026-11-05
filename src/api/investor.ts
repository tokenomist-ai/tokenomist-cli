import type { TokenomistClient } from "./client.js";
import type { ApiResult } from "../types/response.js";
import type { FundraisingInvestors, FundraisingInvestorsAggregated } from "../types/investor.js";

export interface InvestorListParams {
  startLatestFundingDate?: string;
  endLatestFundingDate?: string;
  page?: string;
  pageSize?: string;
}

export async function listInvestors(
  client: TokenomistClient,
  params?: InvestorListParams,
): Promise<ApiResult<FundraisingInvestors[]>> {
  return client.getWithMeta<FundraisingInvestors[]>(
    "/v5/fundraising/investors/list",
    params as Record<string, string>,
  );
}

export interface InvestorDetailParams {
  isLeadInvestor?: string;
  fundingDateMin?: string;
  fundingDateMax?: string;
  raisedAmountMin?: string;
  raisedAmountMax?: string;
}

export async function getInvestorDetail(
  client: TokenomistClient,
  investorId: string,
  params?: InvestorDetailParams,
): Promise<FundraisingInvestorsAggregated> {
  return client.get<FundraisingInvestorsAggregated>(
    `/v5/fundraising/investors/${encodeURIComponent(investorId)}`,
    params as Record<string, string>,
  );
}
