import type { ApiResponse, ApiResult, MetaData } from "../types/response.js";
import { ApiError } from "./errors.js";
import { withRetry } from "./retry.js";
import { ResponseCache } from "./cache.js";

export { ApiError } from "./errors.js";

const HEADER_API_KEY = "x-api-key";
const HEADER_CLIENT_SOURCE = "x-client-source";
const CLIENT_SOURCE_CLI = "cli";

export class TokenomistClient {
  private cache: ResponseCache;

  constructor(
    private apiKey: string,
    private baseUrl: string,
    private options?: { noCache?: boolean },
  ) {
    this.cache = new ResponseCache();
  }

  /** GET a V5 route and return its `data` only. */
  async get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
    return (await this.getWithMeta<T>(path, params)).data;
  }

  /** GET a V5 route and return `data` together with the envelope's `metadata`. */
  async getWithMeta<T>(
    path: string,
    params?: Record<string, string | undefined>,
  ): Promise<ApiResult<T>> {
    const url = this.buildUrl(path, params);
    const urlStr = url.toString();
    const cacheKey = this.cache.buildKey(urlStr, this.apiKey);
    const useCache = this.options?.noCache !== true;

    if (useCache) {
      const cached = this.cache.get<ApiResult<T>>(cacheKey);
      if (cached && typeof cached === "object" && "metadata" in cached) return cached;
    }

    const result = await withRetry(() => this.fetchFromApi<T>(url));

    if (useCache) {
      this.cache.set(cacheKey, urlStr, result);
    }

    return result;
  }

  private buildUrl(path: string, params?: Record<string, string | undefined>): URL {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }
    // Every V5 handler returns an actionable `errorDetail` when asked.
    url.searchParams.set("showError", "true");
    return url;
  }

  private async fetchFromApi<T>(url: URL): Promise<ApiResult<T>> {
    let res: Response;
    try {
      res = await fetch(url.toString(), {
        headers: {
          [HEADER_API_KEY]: this.apiKey,
          [HEADER_CLIENT_SOURCE]: CLIENT_SOURCE_CLI,
        },
      });
    } catch (err) {
      throw ApiError.fromNetworkError(err);
    }

    if (!res.ok) {
      let body: unknown = {};
      try {
        body = await res.json();
      } catch {
        // Response may not be JSON
      }
      const retryAfter = res.headers.get("retry-after") ?? undefined;
      throw ApiError.fromResponse(res.status, body, retryAfter);
    }

    const body = (await res.json()) as ApiResponse<T>;

    if (!body.status) {
      throw ApiError.fromResponse(200, body);
    }

    const metadata: MetaData = body.metadata ?? {};
    // Upstream can send `"data": null` for an empty page.
    const data = (body.data ?? (metadata.page !== undefined ? [] : null)) as T;
    return { data, metadata };
  }
}
