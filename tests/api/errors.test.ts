import { describe, it, expect } from "vitest";
import { ApiError, ErrorCode } from "../../src/api/errors.js";

describe("ErrorCode", () => {
  it("has all expected codes", () => {
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.FORBIDDEN).toBe("FORBIDDEN");
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCode.RATE_LIMITED).toBe("RATE_LIMITED");
    expect(ErrorCode.SERVER_ERROR).toBe("SERVER_ERROR");
    expect(ErrorCode.NETWORK_ERROR).toBe("NETWORK_ERROR");
    expect(ErrorCode.UNKNOWN).toBe("UNKNOWN");
  });
});

describe("ApiError", () => {
  it("stores code, detail, statusCode, retryAfter", () => {
    const err = new ApiError("msg", ErrorCode.RATE_LIMITED, "detail", 429, 5);
    expect(err.message).toBe("msg");
    expect(err.code).toBe(ErrorCode.RATE_LIMITED);
    expect(err.detail).toBe("detail");
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBe(5);
    expect(err.name).toBe("ApiError");
  });

  describe("retryable", () => {
    it("returns true for RATE_LIMITED", () => {
      const err = new ApiError("msg", ErrorCode.RATE_LIMITED);
      expect(err.retryable).toBe(true);
    });

    it("returns true for SERVER_ERROR", () => {
      const err = new ApiError("msg", ErrorCode.SERVER_ERROR);
      expect(err.retryable).toBe(true);
    });

    it("returns true for NETWORK_ERROR", () => {
      const err = new ApiError("msg", ErrorCode.NETWORK_ERROR);
      expect(err.retryable).toBe(true);
    });

    it("returns false for UNAUTHORIZED", () => {
      const err = new ApiError("msg", ErrorCode.UNAUTHORIZED);
      expect(err.retryable).toBe(false);
    });

    it("returns false for NOT_FOUND", () => {
      const err = new ApiError("msg", ErrorCode.NOT_FOUND);
      expect(err.retryable).toBe(false);
    });

    it("returns false for UNKNOWN", () => {
      const err = new ApiError("msg", ErrorCode.UNKNOWN);
      expect(err.retryable).toBe(false);
    });

    it("returns false for FORBIDDEN", () => {
      const err = new ApiError("msg", ErrorCode.FORBIDDEN);
      expect(err.retryable).toBe(false);
    });
  });

  it("has retriesExhausted defaulting to false", () => {
    const err = new ApiError("msg", ErrorCode.SERVER_ERROR);
    expect(err.retriesExhausted).toBe(false);
  });
});

describe("ApiError.fromResponse", () => {
  it("maps 401 to UNAUTHORIZED", () => {
    const err = ApiError.fromResponse(401, { errorMessage: "Bad key" });
    expect(err.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(err.message).toBe("Bad key");
    expect(err.statusCode).toBe(401);
  });

  it("maps 403 to FORBIDDEN", () => {
    const err = ApiError.fromResponse(403, {});
    expect(err.code).toBe(ErrorCode.FORBIDDEN);
    expect(err.statusCode).toBe(403);
  });

  it("maps 404 to NOT_FOUND", () => {
    const err = ApiError.fromResponse(404, {});
    expect(err.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("maps 429 to RATE_LIMITED", () => {
    const err = ApiError.fromResponse(429, {}, "5");
    expect(err.code).toBe(ErrorCode.RATE_LIMITED);
    expect(err.retryAfter).toBe(5);
  });

  it("maps 500 to SERVER_ERROR", () => {
    const err = ApiError.fromResponse(500, { errorMessage: "Oops" });
    expect(err.code).toBe(ErrorCode.SERVER_ERROR);
  });

  it("maps 502 to SERVER_ERROR", () => {
    const err = ApiError.fromResponse(502, {});
    expect(err.code).toBe(ErrorCode.SERVER_ERROR);
  });

  it("maps unknown status to UNKNOWN", () => {
    const err = ApiError.fromResponse(418, {});
    expect(err.code).toBe(ErrorCode.UNKNOWN);
  });

  it("extracts errorMessage and errorDetail from body", () => {
    const err = ApiError.fromResponse(500, {
      errorMessage: "Server broke",
      errorDetail: "Stack trace here",
    });
    expect(err.message).toBe("Server broke");
    expect(err.detail).toBe("Stack trace here");
  });

  it("falls back to generic message when body has no errorMessage", () => {
    const err = ApiError.fromResponse(500, {});
    expect(err.message).toBe("HTTP 500");
  });

  it("handles non-object body gracefully", () => {
    const err = ApiError.fromResponse(500, null);
    expect(err.message).toBe("HTTP 500");
  });

  it("ignores non-numeric Retry-After", () => {
    const err = ApiError.fromResponse(429, {}, "not-a-number");
    expect(err.retryAfter).toBeUndefined();
  });

  it("ignores zero Retry-After", () => {
    const err = ApiError.fromResponse(429, {}, "0");
    expect(err.retryAfter).toBeUndefined();
  });

  it("ignores negative Retry-After", () => {
    const err = ApiError.fromResponse(429, {}, "-5");
    expect(err.retryAfter).toBeUndefined();
  });

  it("handles string body gracefully", () => {
    const err = ApiError.fromResponse(502, "Bad Gateway");
    expect(err.message).toBe("HTTP 502");
    expect(err.code).toBe(ErrorCode.SERVER_ERROR);
  });

  it("handles API-level error (status false with statusCode in body)", () => {
    const err = ApiError.fromResponse(200, {
      status: false,
      statusCode: 401,
      errorMessage: "Invalid API key",
      errorDetail: "Key expired",
    });
    expect(err.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(err.message).toBe("Invalid API key");
    expect(err.detail).toBe("Key expired");
    expect(err.statusCode).toBe(401);
  });

  it("maps API-level error with no statusCode to UNKNOWN", () => {
    const err = ApiError.fromResponse(200, {
      status: false,
      errorMessage: "Something went wrong",
    });
    expect(err.code).toBe(ErrorCode.UNKNOWN);
  });
});

describe("ApiError.fromNetworkError", () => {
  it("wraps Error as NETWORK_ERROR", () => {
    const err = ApiError.fromNetworkError(new Error("fetch failed"));
    expect(err.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(err.message).toBe("fetch failed");
    expect(err.retryable).toBe(true);
  });

  it("wraps non-Error as NETWORK_ERROR", () => {
    const err = ApiError.fromNetworkError("string error");
    expect(err.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(err.message).toBe("string error");
  });
});
