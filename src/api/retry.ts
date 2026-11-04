import { ApiError, errorHeadline } from "./errors.js";

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

const DEFAULTS = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30_000,
} as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? DEFAULTS.maxAttempts;
  const baseDelay = options?.baseDelay ?? DEFAULTS.baseDelay;
  const maxDelay = options?.maxDelay ?? DEFAULTS.maxDelay;

  let lastError: ApiError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof ApiError) || !err.retryable) {
        throw err;
      }

      lastError = err;

      if (attempt === maxAttempts) {
        break;
      }

      const jitter = Math.random() * 500;
      const calculated = baseDelay * Math.pow(2, attempt - 1) + jitter;
      const delay = err.retryAfter
        ? Math.min(err.retryAfter * 1000, maxDelay)
        : Math.min(calculated, maxDelay);

      process.stderr.write(
        `${errorHeadline(err)}. Retrying in ${Math.round(delay / 1000)}s... (attempt ${attempt + 1}/${maxAttempts})\n`,
      );

      await sleep(delay);
    }
  }

  lastError!.retriesExhausted = true;
  lastError!.attempts = maxAttempts;
  throw lastError;
}
