import type { TokenomistClient } from "./client.js";
import type { TokenV4, SearchTokenV5 } from "../types/token.js";

export async function listTokens(
  client: TokenomistClient,
  params?: { tokenId?: string },
): Promise<TokenV4[]> {
  return client.get<TokenV4[]>("/v5/token/list", params as Record<string, string>);
}

export async function searchTokens(
  client: TokenomistClient,
  query: string,
): Promise<SearchTokenV5[]> {
  return client.get<SearchTokenV5[]>("/v5/search-token", { query });
}
