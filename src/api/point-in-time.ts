import type { TokenomistClient } from "./client.js";
import type { ApiResult } from "../types/response.js";
import type {
  PointInTimeVersion,
  PointInTimeAllocation,
  PointInTimeEmissionDay,
  PointInTimeUnlockEvent,
} from "../types/point-in-time.js";

/** Picks the version a data route answers from: one or the other, or neither for the current one. */
export interface VersionSelector {
  asOf?: string;
  versionId?: string;
}

export interface PointInTimeVersionsParams {
  start?: string;
  end?: string;
  page?: string;
  pageSize?: string;
}

export interface PointInTimeSeriesParams extends VersionSelector {
  start?: string;
  end?: string;
  standardAllocation?: string;
  page?: string;
  pageSize?: string;
}

const BASE = "/v5/point-in-time";

export async function getTokenVersions(
  client: TokenomistClient,
  tokenId: string,
  params?: PointInTimeVersionsParams,
): Promise<ApiResult<PointInTimeVersion[]>> {
  return client.getWithMeta<PointInTimeVersion[]>(
    `${BASE}/token-versions/${encodeURIComponent(tokenId)}`,
    { ...params },
  );
}

export async function getPointInTimeAllocation(
  client: TokenomistClient,
  tokenId: string,
  params?: VersionSelector,
): Promise<ApiResult<PointInTimeAllocation>> {
  return client.getWithMeta<PointInTimeAllocation>(
    `${BASE}/allocations/${encodeURIComponent(tokenId)}`,
    { ...params },
  );
}

export async function getPointInTimeDailyEmission(
  client: TokenomistClient,
  tokenId: string,
  params?: PointInTimeSeriesParams,
): Promise<ApiResult<PointInTimeEmissionDay[]>> {
  return client.getWithMeta<PointInTimeEmissionDay[]>(
    `${BASE}/daily-emission/${encodeURIComponent(tokenId)}`,
    { ...params },
  );
}

export async function getPointInTimeUnlockEvents(
  client: TokenomistClient,
  tokenId: string,
  params?: PointInTimeSeriesParams,
): Promise<ApiResult<PointInTimeUnlockEvent[]>> {
  return client.getWithMeta<PointInTimeUnlockEvent[]>(
    `${BASE}/unlock/events/${encodeURIComponent(tokenId)}`,
    { ...params },
  );
}
