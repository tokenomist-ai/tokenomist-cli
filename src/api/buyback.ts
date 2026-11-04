import type { TokenomistClient } from "./client.js";
import type { ApiResult } from "../types/response.js";
import type { BuybackTokenList, BuybackToken } from "../types/buyback.js";

export interface BuybackListParams {
  tokenId?: string;
  page?: string;
  pageSize?: string;
}

export async function listBuybacks(
  client: TokenomistClient,
  params?: BuybackListParams,
): Promise<ApiResult<BuybackTokenList[]>> {
  return client.getWithMeta<BuybackTokenList[]>("/v5/buyback/list", { ...params });
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
