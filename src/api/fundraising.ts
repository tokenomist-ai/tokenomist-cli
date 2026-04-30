import type { TokenomistClient } from "./client.js";
import type { FundraisingToken } from "../types/fundraising.js";

export interface FundraisingParams {
  fundingDateMin?: string;
  fundingDateMax?: string;
  raisedAmountMin?: string;
  raisedAmountMax?: string;
}

export async function getFundraising(
  client: TokenomistClient,
  tokenId: string,
  params?: FundraisingParams,
): Promise<FundraisingToken> {
  return client.get<FundraisingToken>(
    `/v5/fundraising/token/${encodeURIComponent(tokenId)}`,
    params as Record<string, string>,
  );
}
