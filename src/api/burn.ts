import type { TokenomistClient } from "./client.js";
import type { BurnTokenList, BurnToken } from "../types/burn.js";

export interface BurnListParams {
  tokenId?: string;
  page?: string;
  pageSize?: string;
}

export async function listBurns(
  client: TokenomistClient,
  params?: BurnListParams,
): Promise<BurnTokenList[]> {
  return client.get<BurnTokenList[]>("/v5/burn/list", params as Record<string, string>);
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
