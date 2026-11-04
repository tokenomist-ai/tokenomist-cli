export interface CreditMetaData {
  used: number;
  limit: number;
  resetAt?: string;
}

export interface MetaData {
  queryDate?: string;
  timestamp?: number;
  credit?: CreditMetaData;
  // V5 paginated endpoints put these flat in metadata (omitempty: `total` is
  // absent on an empty result).
  page?: number;
  totalPages?: number;
  pageSize?: number;
  total?: number;
  // Point-in-time routes: the instant the answer is evaluated at and the
  // version that answered it (project "-p-" or published "-r-" shape).
  asOf?: string;
  version?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  metadata: MetaData;
  status: boolean;
  statusCode?: number;
  data?: T;
  errorMessage?: string;
  errorDetail?: string;
  // Point-in-time routes only.
  errorCode?: string;
  earliestValidDate?: string;
}

export interface ApiResult<T> {
  data: T;
  metadata: MetaData;
}

export interface Pagination {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
}
