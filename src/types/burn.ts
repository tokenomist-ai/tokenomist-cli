export interface BurnEventMetadata {
  burners: string[];
  burnReasons: string[];
}

export interface BurnEvent {
  burnEventLabel: string;
  burnType: string;
  burnDate: string;
  amount: number;
  pricePerToken: number;
  /** USD value of the burned amount (amount × pricePerToken). */
  value: number;
  metadata: BurnEventMetadata;
}

export interface BurnTokenList {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  totalBurnAmount: number;
  /** USD; null when no burn has a price. */
  totalBurnValue: number | null;
}

export interface BurnToken {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  totalBurnAmount: number;
  /** USD; recomputed from the returned events when --start/--end is set. */
  totalBurnValue: number | null;
  burns: BurnEvent[];
}
