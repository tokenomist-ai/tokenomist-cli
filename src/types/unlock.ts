export interface UnlockEventListCliffAllocation {
  allocationName: string;
  standardAllocationName: string;
  cliffAmount: number;
  cliffValue: number;
  unlockPrecision: string;
}

export interface UnlockEventListCliff {
  totalCliffAmount: number;
  totalCliffValue: number;
  valueToMarketCap: number | null;
  allocationBreakdown: UnlockEventListCliffAllocation[];
}

export interface UnlockEventListEvent {
  unlockDate: string;
  referencePrice: number;
  referencePriceUpdatedTime: string;
  cliffUnlocks: UnlockEventListCliff;
  latestUpdateDate: string;
}

export interface UnlockEventList {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  marketCap: number | null;
  releasedPercentage: number;
  listedMethod: string;
  dataSource: string;
  events: UnlockEventListEvent[];
}

export interface UnlockEventListUpcoming {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  marketCap: number | null;
  releasedPercentage: number;
  listedMethod: string;
  dataSource: string;
  upcomingEvent: UnlockEventListEvent;
}

import type { CommittedClaim } from "./emission.js";

export interface CliffUnlockAllocation {
  unlockDate: string;
  allocationName: string;
  standardAllocationName: string;
  cliffAmount: number;
  cliffValue: number;
  referencePrice: number;
  referencePriceUpdatedTime: string;
  unlockPrecision: string;
  committedClaim?: CommittedClaim | null;
}

export interface CliffUnlockV4 {
  cliffAmount: number;
  cliffValue: number;
  valueToMarketCap: number | null;
  allocationBreakdown: CliffUnlockAllocation[];
}

export interface UnlockEventV4 {
  unlockDate: string;
  tokenName: string;
  tokenSymbol: string;
  listedMethod: string;
  dataSource: string;
  cliffUnlocks: CliffUnlockV4;
  latestUpdateDate: string;
}
