export interface StandardAllocationData {
  allocationName: string;
  allocationType: string;
  standardAllocationName: string;
  allocationUnlockedAmount: number;
  allocationLockedAmount: number;
  allocationAmount: number;
  trackedAllocationPercentage: number | null;
}

export interface StandardAllocation {
  name: string;
  symbol: string;
  listedMethod?: string;
  maxSupply: number | null;
  lastUpdatedDate: string;
  totalUnlockedAmount: number;
  totalLockedAmount: number;
  totalUntrackedAmount: number;
  totalTBDLockedAmount: number;
  allocations: StandardAllocationData[];
}
