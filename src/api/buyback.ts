import type { TokenomistClient } from "./client.js";
import type { BuybackTokenList, BuybackToken } from "../types/buyback.js";

export interface BuybackListParams {
  tokenId?: string;
  page?: string;
  pageSize?: string;
}

export async function listBuybacks(
  client: TokenomistClient,
  params?: BuybackListParams,
): Promise<BuybackTokenList[]> {
  return client.get<BuybackTokenList[]>("/v5/buyback/list", params as Record<string, string>);
}

export async function getBuybackDetail(
  client: TokenomistClient,
  tokenId: string,
  params?: { start?: string; end?: string },
): Promise<BuybackToken> {
  return client.get<BuybackToken>(
    `/v5/buyback/${encodeURIComponent(tokenId)}`,
    params as Record<string, string>,
  );
}
