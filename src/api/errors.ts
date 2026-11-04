export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  SERVER_ERROR = "SERVER_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN = "UNKNOWN",
}

function classifyStatus(status: number): ErrorCode {
  if (status === 400) return ErrorCode.BAD_REQUEST;
  if (status === 401) return ErrorCode.UNAUTHORIZED;
  if (status === 403) return ErrorCode.FORBIDDEN;
  if (status === 404) return ErrorCode.NOT_FOUND;
  if (status === 422) return ErrorCode.VALIDATION_ERROR;
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
  /** How many attempts were made before giving up (set with retriesExhausted). */
  public attempts?: number;
  /** Point-in-time routes: machine-readable cause, e.g. NO_VERSION_AT_AS_OF. */
  public errorCode?: string;
  /** Point-in-time routes: the next/first `asOf` that has a version (on NO_VERSION_AT_AS_OF, or inside the plan's range on PLAN_NOT_ELIGIBLE). */
  public earliestValidDate?: string;
  /** 422 validation errors: one entry per failing field. */
  public fieldErrors?: { key: string; value: unknown; message: string }[];

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

    let err: ApiError;
    if (status === 200 && b.status === false) {
      // API-level error: HTTP 200 but body.status === false
      const bodyStatus = typeof b.statusCode === "number" ? b.statusCode : 0;
      const code = bodyStatus > 0 ? classifyStatus(bodyStatus) : ErrorCode.UNKNOWN;
      err = new ApiError(
        errorMessage || "API request failed",
        code,
        errorDetail,
        bodyStatus || undefined,
      );
    } else {
      // HTTP-level error
      err = new ApiError(
        errorMessage || `HTTP ${status}`,
        classifyStatus(status),
        errorDetail,
        status,
        parseRetryAfter(retryAfterHeader),
      );
    }

    if (typeof b.errorCode === "string" && b.errorCode) err.errorCode = b.errorCode;
    if (typeof b.earliestValidDate === "string" && b.earliestValidDate) {
      err.earliestValidDate = b.earliestValidDate;
    }
    if (Array.isArray(b.data)) {
      const fields = b.data.filter(
        (f): f is { key: string; value: unknown; message: string } =>
          !!f && typeof f === "object" && typeof (f as { message?: unknown }).message === "string",
      );
      if (fields.length > 0) err.fieldErrors = fields;
    }
    return err;
  }

  static fromNetworkError(error: unknown): ApiError {
    const message = error instanceof Error ? error.message : String(error);
    return new ApiError(message, ErrorCode.NETWORK_ERROR);
  }
}

/** "CODE (errorCode): message", the first line of an error and of each retry log line. */
export function errorHeadline(err: ApiError): string {
  const code = err.errorCode ? `${err.code} (${err.errorCode})` : err.code;
  return `${code}: ${err.message}`;
}

/** The lines the CLI prints for an API error. */
export function formatApiError(err: ApiError): string[] {
  // After exhausted retries the last log line reads "Retrying…", so the
  // headline says the CLI gave up.
  const gaveUp = err.retriesExhausted
    ? ` (gave up after ${err.attempts ?? "repeated"} attempts)`
    : "";
  const lines = [`${errorHeadline(err)}${gaveUp}`];
  // V5 details usually restate the message; skip an exact repeat.
  if (err.detail && err.detail !== err.message) lines.push(`Detail: ${err.detail}`);
  for (const f of err.fieldErrors ?? []) {
    lines.push(`  - ${f.key}: ${f.message}`);
  }
  if (err.earliestValidDate) lines.push(`Earliest valid date: ${err.earliestValidDate}`);
  return lines;
}
