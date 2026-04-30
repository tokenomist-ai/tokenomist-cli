export interface TokenV4 {
  id: string;
  name: string;
  symbol: string;
  listedMethod?: string;
  circulatingSupply: number | null;
  marketCap: number | null;
  maxSupply: number | null;
  totalLockedAmount: number;
  tbdLockedAmount: number;
  unlockedAmount: number;
  untrackedAmount: number;
  hasStandardAllocation: boolean;
  hasFundraising: boolean;
  latestFundraisingRound: string | null;
  hasBurn: boolean;
  hasBuyback: boolean;
  hasCommittedClaim: boolean;
  websiteUrl: string;
  lastUpdatedDate: string;
}

export interface SearchTokenV5 {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
}
