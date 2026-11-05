import type { TokenomistClient } from "./client.js";
import type { ApiResult } from "../types/response.js";
import type { EmissionBreakdown } from "../types/emission.js";

export interface EmissionParams {
  standardAllocation?: string;
  start?: string;
  end?: string;
  page?: string;
  pageSize?: string;
}

export async function getDailyEmission(
  client: TokenomistClient,
  tokenId: string,
  params?: EmissionParams,
): Promise<ApiResult<EmissionBreakdown[]>> {
  return client.getWithMeta<EmissionBreakdown[]>(
    `/v5/daily-emission/${encodeURIComponent(tokenId)}`,
    params as Record<string, string>,
  );
}

export async function getWeeklyEmission(
  client: TokenomistClient,
  tokenId: string,
  params?: EmissionParams,
): Promise<ApiResult<EmissionBreakdown[]>> {
  return client.getWithMeta<EmissionBreakdown[]>(
    `/v5/emission/${encodeURIComponent(tokenId)}`,
    params as Record<string, string>,
  );
}
