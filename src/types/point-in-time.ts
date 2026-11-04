// Point-in-time (/v5/point-in-time/*): a token's data as published at a past
// version. These shapes carry no USD fields.

import type { StandardAllocationData } from "./allocation.js";

export interface PointInTimeChange {
  category?: string;
  title: string | null;
  description: string | null;
  basis: string;
}

export interface PointInTimeReference {
  name: string;
  url?: string | null;
  sourceType?: string | null;
  sourceDate?: string | null;
  private?: boolean;
}

/** One version on the token's project timeline. */
export interface PointInTimeVersion {
  id: string;
  tokenId: string;
  historyOrder: number;
  status: string;
  validFrom: string;
  validFromBasis: string;
  validUntil: string | null;
  disclosedAt: string | null;
  previousVersionId: string | null;
  change: PointInTimeChange;
  changeReferences: PointInTimeReference[];
  listedMethod?: string;
  dataSource: string;
}

export interface PointInTimeAllocation {
  name: string;
  symbol: string;
  listedMethod?: string;
  maxSupply: number | null;
  totalUnlockedAmount: number;
  totalLockedAmount: number;
  totalUntrackedAmount: number;
  totalTBDLockedAmount: number;
  allocations: StandardAllocationData[];
}

/** A committed claim as known at asOf (no USD value). */
export interface PointInTimeClaim {
  amount: number | null;
  timestamp: number | null;
}

export interface PointInTimeEmissionAllocation {
  allocationName: string;
  standardAllocationName: string | null;
  unlockAmount: number;
  committedClaim: PointInTimeClaim | null;
}

export interface PointInTimeEmissionDay {
  startDate: string;
  endDate: string;
  tokenName: string;
  tokenSymbol: string;
  listedMethod?: string;
  unlockAmount: number;
  allocations: PointInTimeEmissionAllocation[];
  totalCumulativeUnlockedAmount: number;
  committedClaim: PointInTimeClaim | null;
}

export interface PointInTimeCliffAllocation {
  unlockDate: string;
  allocationName: string;
  standardAllocationName: string;
  cliffAmount: number;
  unlockPrecision: string;
  committedClaim: PointInTimeClaim | null;
}

export interface PointInTimeUnlockEvent {
  unlockDate: string;
  tokenName: string;
  tokenSymbol: string;
  listedMethod: string;
  dataSource: string;
  cliffUnlocks: {
    cliffAmount: number;
    allocationBreakdown: PointInTimeCliffAllocation[];
  };
}
