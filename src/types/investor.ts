export interface FundraisingInvestorsFundingRound {
  tokenId: string;
  roundName: string;
  isLeadInvestor: boolean;
  fundingDate: string | null;
  totalAmountRaisedinThatRound: number | null;
  valuation: number | null;
  pricePerToken: number | null;
}

export interface FundraisingInvestors {
  investorId: string;
  investorName: string;
  website: string;
  fundingRounds?: FundraisingInvestorsFundingRound[];
  latestFundingDate: string;
  latestFundingRound?: string;
}

export interface FundraisingInvestorsAggregated {
  investorId: string;
  investorName: string;
  website: string;
  fundingRounds: FundraisingInvestorsFundingRound[];
  latestFundingDate: string;
  latestFundingRound?: string;
}
