export interface MetaData {
  queryDate?: string;
  timestamp?: number;
}

export interface ApiResponse<T> {
  metadata: MetaData;
  status: boolean;
  statusCode?: number;
  data?: T;
  errorMessage?: string;
  errorDetail?: string;
}
