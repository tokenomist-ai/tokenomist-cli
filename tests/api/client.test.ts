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

    expect(mockFetch).toHaveBeenCalledWith("https://api.test.com/v1/test?foo=bar", {
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
    expect(calledUrl).toBe("https://api.test.com/v1/test?foo=bar");
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
});
