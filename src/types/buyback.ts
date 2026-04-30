export interface BuybackEvent {
  buybackEventLabel: string;
  buybackType: string;
  buybackDate: string;
  tokenAmount: number;
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
}

export interface BuybackToken {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  totalBuybackAmount: number;
  buybacks: BuybackEvent[];
}
