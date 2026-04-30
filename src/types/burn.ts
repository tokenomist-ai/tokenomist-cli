export interface BurnEventMetadata {
  burners: string[];
  burnReasons: string[];
}

export interface BurnEvent {
  burnEventLabel: string;
  burnType: string;
  burnDate: string;
  amount: number;
  metadata: BurnEventMetadata;
}

export interface BurnTokenList {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  totalBurnAmount: number;
}

export interface BurnToken {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  totalBurnAmount: number;
  burns: BurnEvent[];
}
