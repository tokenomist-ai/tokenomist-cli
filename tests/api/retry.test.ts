import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry } from "../../src/api/retry.js";
import { ApiError, ErrorCode } from "../../src/api/errors.js";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// Helper: advance fake timers so sleep() resolves between retry attempts
async function flushRetries() {
  await vi.advanceTimersByTimeAsync(60_000);
}

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable ApiError and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ApiError("fail", ErrorCode.SERVER_ERROR, undefined, 500))
      .mockResolvedValueOnce("recovered");

    const promise = withRetry(fn, { baseDelay: 1000 });
    await flushRetries();
    const result = await promise;
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable ApiError", async () => {
    const err = new ApiError("forbidden", ErrorCode.FORBIDDEN, undefined, 403);
    const fn = vi.fn().mockRejectedValue(err);

    await expect(withRetry(fn)).rejects.toThrow("forbidden");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry non-ApiError exceptions", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("random"));

    await expect(withRetry(fn)).rejects.toThrow("random");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws last error after max attempts with retriesExhausted", async () => {
    const err = new ApiError("down", ErrorCode.SERVER_ERROR, undefined, 500);
    const fn = vi.fn().mockRejectedValue(err);

    const promise = withRetry(fn, { maxAttempts: 3 }).catch((e) => e);
    await flushRetries();
    const caught = await promise;
    expect(caught).toBeInstanceOf(ApiError);
    expect(caught.retriesExhausted).toBe(true);
    expect(caught.attempts).toBe(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("respects retryAfter on ApiError", async () => {
    const err = new ApiError("rate limited", ErrorCode.RATE_LIMITED, undefined, 429, 2);
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValueOnce("ok");

    const promise = withRetry(fn);

    // Advance less than retryAfter (2s) — should not have retried yet
    await vi.advanceTimersByTimeAsync(1500);
    expect(fn).toHaveBeenCalledTimes(1);

    // Advance past retryAfter
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("caps delay at maxDelay", async () => {
    const err = new ApiError("rate limited", ErrorCode.RATE_LIMITED, undefined, 429, 60);
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValueOnce("ok");

    const promise = withRetry(fn, { maxDelay: 5000 });

    // maxDelay=5s should cap the 60s retryAfter
    await vi.advanceTimersByTimeAsync(5500);
    const result = await promise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses default maxAttempts of 3", async () => {
    const err = new ApiError("fail", ErrorCode.NETWORK_ERROR);
    const fn = vi.fn().mockRejectedValue(err);

    const promise = withRetry(fn).catch((e) => e);
    await flushRetries();
    await promise;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("logs retry attempts to stderr", async () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const err = new ApiError("fail", ErrorCode.SERVER_ERROR, undefined, 500);
    err.errorCode = "INTERNAL_ERROR";
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValueOnce("ok");

    const promise = withRetry(fn);
    await flushRetries();
    await promise;
    expect(stderrSpy).toHaveBeenCalled();
    const output = stderrSpy.mock.calls.map((c) => String(c[0])).join("");
    expect(output).toContain("SERVER_ERROR (INTERNAL_ERROR): fail. Retrying");
    expect(output).toContain("attempt 2/3");
  });
});
