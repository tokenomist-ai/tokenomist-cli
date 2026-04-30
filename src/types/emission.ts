export interface CommittedClaim {
  amount: number | null;
  value: number | null;
  timestamp: number | null;
}

export interface EmissionBreakdownAllocation {
  allocationName: string;
  standardAllocationName: string | null;
  unlockAmount: number;
  unlockValue: number;
  committedClaim?: CommittedClaim | null;
}

export interface EmissionBreakdown {
  startDate: string;
  endDate: string;
  tokenName: string;
  tokenSymbol: string;
  listedMethod?: string;
  unlockAmount: number;
  unlockValue: number;
  referencePrice: number;
  allocations: EmissionBreakdownAllocation[];
  totalCumulativeUnlockedAmount: number;
  committedClaim?: CommittedClaim | null;
}
