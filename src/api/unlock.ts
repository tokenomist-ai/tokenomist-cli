import type { TokenomistClient } from "./client.js";
import type { UnlockEventList, UnlockEventListUpcoming, UnlockEventV4 } from "../types/unlock.js";

export interface UnlockListParams {
  minMarketCap?: string;
  minReleasedPercentage?: string;
  minUnlockDate?: string;
  maxUnlockDate?: string;
  minTotalUnlockAmount?: string;
  minValueToMarketCap?: string;
  standardAllocation?: string;
  page?: string;
  pageSize?: string;
}

export interface UnlockUpcomingParams {
  start?: string;
  end?: string;
  standardAllocation?: string;
  minMarketCap?: string;
  minReleasedPercentage?: string;
  minTotalUnlockAmount?: string;
  minValueToMarketCap?: string;
  page?: string;
  pageSize?: string;
}

export interface UnlockEventsParams {
  standardAllocation?: string;
  start?: string;
  end?: string;
  page?: string;
  pageSize?: string;
}

export async function listUnlockEvents(
  client: TokenomistClient,
  params?: UnlockListParams,
): Promise<UnlockEventList[]> {
  return client.get<UnlockEventList[]>("/v5/unlock/events/list", params as Record<string, string>);
}

export async function listUpcomingUnlockEvents(
  client: TokenomistClient,
  params?: UnlockUpcomingParams,
): Promise<UnlockEventListUpcoming[]> {
  return client.get<UnlockEventListUpcoming[]>(
    "/v5/unlock/events/upcoming",
    params as Record<string, string>,
  );
}

export async function getUnlockEvents(
  client: TokenomistClient,
  tokenId: string,
  params?: UnlockEventsParams,
): Promise<UnlockEventV4[]> {
  return client.get<UnlockEventV4[]>(
    `/v5/unlock/events/${encodeURIComponent(tokenId)}`,
    params as Record<string, string>,
  );
}
