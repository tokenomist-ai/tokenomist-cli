export interface BuybackEvent {
  buybackEventLabel: string;
  buybackType: string;
  buybackDate: string;
  tokenAmount: number;
  pricePerToken: number;
  value: number;
  spentAmount: number | null;
  spentUnit: string;
  targetAddress: string;
  buyerAddress: string;
  resolution: string;
  basis: string;
}

export interface BuybackTokenList {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  totalBuybackAmount: number;
  /** USD; null when no buyback has a price. */
  totalBuybackValue: number | null;
}

export interface BuybackToken {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  totalBuybackAmount: number;
  /** USD; recomputed from the returned events when --start/--end is set. */
  totalBuybackValue: number | null;
  buybacks: BuybackEvent[];
}
