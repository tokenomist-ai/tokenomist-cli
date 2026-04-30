import type { TokenomistClient } from "./client.js";
import type { StandardAllocation } from "../types/allocation.js";

export async function getAllocation(
  client: TokenomistClient,
  tokenId: string,
): Promise<StandardAllocation> {
  return client.get<StandardAllocation>(`/v5/allocations/${encodeURIComponent(tokenId)}`);
}
