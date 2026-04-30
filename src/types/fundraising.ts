export interface FundraisingTokenInvestor {
  investorId: string;
  investorName: string;
  isLeadInvestor: boolean;
}

export interface FundraisingTokenFundingRound {
  fundingRound: string;
  fundingDate: string | null;
  raiseType: string | null;
  amountRaised: number | null;
  valuation: number | null;
  pricePerToken: number | null;
  sourceURLList: string[];
  investors: FundraisingTokenInvestor[];
  numberOfInvestors: number;
}

export interface FundraisingToken {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  listedMethod: string;
  totalAmountRaised: number | null;
  unlockedInvestor: number | null;
  investorReleasedPercentage: number | null;
  fundingRounds: FundraisingTokenFundingRound[];
}
