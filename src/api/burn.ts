import type { TokenomistClient } from "./client.js";
import type { ApiResult } from "../types/response.js";
import type { BurnTokenList, BurnToken } from "../types/burn.js";

export interface BurnListParams {
  tokenId?: string;
  page?: string;
  pageSize?: string;
}

export async function listBurns(
  client: TokenomistClient,
  params?: BurnListParams,
): Promise<ApiResult<BurnTokenList[]>> {
  return client.getWithMeta<BurnTokenList[]>("/v5/burn/list", { ...params });
}

export async function getBurnDetail(
  client: TokenomistClient,
  tokenId: string,
  params?: { start?: string; end?: string },
): Promise<BurnToken> {
  return client.get<BurnToken>(
    `/v5/burn/${encodeURIComponent(tokenId)}`,
    params as Record<string, string>,
  );
}
