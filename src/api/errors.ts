export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMITED = "RATE_LIMITED",
  SERVER_ERROR = "SERVER_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN = "UNKNOWN",
}

function classifyStatus(status: number): ErrorCode {
  if (status === 401) return ErrorCode.UNAUTHORIZED;
  if (status === 403) return ErrorCode.FORBIDDEN;
  if (status === 404) return ErrorCode.NOT_FOUND;
  if (status === 429) return ErrorCode.RATE_LIMITED;
  if (status >= 500 && status < 600) return ErrorCode.SERVER_ERROR;
  return ErrorCode.UNKNOWN;
}

function parseRetryAfter(value?: string): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

export class ApiError extends Error {
  public retriesExhausted = false;

  constructor(
    message: string,
    public code: ErrorCode,
    public detail?: string,
    public statusCode?: number,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get retryable(): boolean {
    return (
      this.code === ErrorCode.RATE_LIMITED ||
      this.code === ErrorCode.SERVER_ERROR ||
      this.code === ErrorCode.NETWORK_ERROR
    );
  }

  static fromResponse(status: number, body: unknown, retryAfterHeader?: string): ApiError {
    const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const errorMessage = typeof b.errorMessage === "string" ? b.errorMessage : undefined;
    const errorDetail = typeof b.errorDetail === "string" ? b.errorDetail : undefined;

    // API-level error: HTTP 200 but body.status === false
    if (status === 200 && b.status === false) {
      const bodyStatus = typeof b.statusCode === "number" ? b.statusCode : 0;
      const code = bodyStatus > 0 ? classifyStatus(bodyStatus) : ErrorCode.UNKNOWN;
      return new ApiError(
        errorMessage || "API request failed",
        code,
        errorDetail,
        bodyStatus || undefined,
      );
    }

    // HTTP-level error
    const code = classifyStatus(status);
    return new ApiError(
      errorMessage || `HTTP ${status}`,
      code,
      errorDetail,
      status,
      parseRetryAfter(retryAfterHeader),
    );
  }

  static fromNetworkError(error: unknown): ApiError {
    const message = error instanceof Error ? error.message : String(error);
    return new ApiError(message, ErrorCode.NETWORK_ERROR);
  }
}
