import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TokenomistClient } from "../../src/api/client.js";
import { ApiError, ErrorCode } from "../../src/api/errors.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock withRetry to pass through without actual retries — retry logic is tested in retry.test.ts
vi.mock("../../src/api/retry.js", () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

describe("TokenomistClient", () => {
  let client: TokenomistClient;

  beforeEach(() => {
    client = new TokenomistClient("test-api-key", "https://api.test.com", {
      noCache: true,
    });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends correct headers and URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: true, data: [] }),
    });

    await client.get("/v1/test", { foo: "bar" });

    expect(mockFetch).toHaveBeenCalledWith("https://api.test.com/v1/test?foo=bar&showError=true", {
      headers: {
        "x-api-key": "test-api-key",
        "x-client-source": "cli",
      },
    });
  });

  it("skips empty params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: true, data: [] }),
    });

    await client.get("/v1/test", { foo: "bar", empty: "" });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe("https://api.test.com/v1/test?foo=bar&showError=true");
  });

  it("returns data on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: true, data: [{ id: 1 }] }),
    });

    const result = await client.get("/v1/test");
    expect(result).toEqual([{ id: 1 }]);
  });

  it("throws ApiError with SERVER_ERROR code on HTTP 500", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      headers: { get: () => null },
      json: async () => ({}),
    });

    try {
      await client.get("/v1/test");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe(ErrorCode.SERVER_ERROR);
      expect(apiErr.statusCode).toBe(500);
    }
  });

  it("throws ApiError with UNAUTHORIZED code when body status is false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: false,
        errorMessage: "Invalid API key",
        errorDetail: "The provided API key is not valid",
        statusCode: 401,
      }),
    });

    try {
      await client.get("/v1/test");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(apiErr.message).toBe("Invalid API key");
      expect(apiErr.detail).toBe("The provided API key is not valid");
    }
  });

  it("wraps network errors as NETWORK_ERROR", async () => {
    mockFetch.mockRejectedValueOnce(new Error("fetch failed"));

    try {
      await client.get("/v1/test");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe(ErrorCode.NETWORK_ERROR);
    }
  });
  it("skips undefined params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: true, data: [] }),
    });

    await client.get("/v1/test", { foo: undefined, bar: "1" });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe("https://api.test.com/v1/test?bar=1&showError=true");
  });

  it("getWithMeta returns data with pagination metadata", async () => {
    const metadata = {
      queryDate: "2026-11-04T00:00:00Z",
      page: 1,
      totalPages: 14,
      pageSize: 2,
      total: 28,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ metadata, status: true, data: [{ id: 1 }] }),
    });

    const result = await client.getWithMeta("/v5/burn/list");
    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.metadata).toEqual(metadata);
  });

  it("turns a null page into an empty array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metadata: { page: 1, totalPages: 1, pageSize: 20 },
        status: true,
        data: null,
      }),
    });

    const result = await client.getWithMeta("/v5/unlock/events/list");
    expect(result.data).toEqual([]);
  });

  it("carries point-in-time errorCode and earliestValidDate", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: { get: () => null },
      json: async () => ({
        status: false,
        statusCode: 404,
        errorCode: "NO_VERSION_AT_AS_OF",
        errorMessage: "No version at asOf",
        errorDetail:
          "arbitrum has no version at 2020-01-01. The first starts at 2023-03-16T13:08:18Z",
        earliestValidDate: "2023-03-16T13:08:18Z",
      }),
    });

    try {
      await client.get("/v5/point-in-time/allocations/arbitrum", { asOf: "2020-01-01" });
      expect.fail("Should have thrown");
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe(ErrorCode.NOT_FOUND);
      expect(apiErr.errorCode).toBe("NO_VERSION_AT_AS_OF");
      expect(apiErr.earliestValidDate).toBe("2023-03-16T13:08:18Z");
    }
  });
});
