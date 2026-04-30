import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ResponseCache } from "../../src/api/cache.js";
import { mkdirSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("ResponseCache", () => {
  let cacheDir: string;
  let cache: ResponseCache;

  beforeEach(() => {
    cacheDir = join(tmpdir(), `tokenomist-cache-test-${Date.now()}`);
    mkdirSync(cacheDir, { recursive: true });
    cache = new ResponseCache(5000, cacheDir); // 5s TTL, custom dir
  });

  afterEach(() => {
    rmSync(cacheDir, { recursive: true, force: true });
  });

  describe("buildKey", () => {
    it("returns a hex string", () => {
      const key = cache.buildKey("https://api.test.com/v1/test?a=1");
      expect(key).toMatch(/^[a-f0-9]{32}$/);
    });

    it("produces same key for same URL", () => {
      const a = cache.buildKey("https://api.test.com/v1/test?a=1");
      const b = cache.buildKey("https://api.test.com/v1/test?a=1");
      expect(a).toBe(b);
    });

    it("produces same key regardless of param order", () => {
      const a = cache.buildKey("https://api.test.com/v1/test?a=1&b=2");
      const b = cache.buildKey("https://api.test.com/v1/test?b=2&a=1");
      expect(a).toBe(b);
    });

    it("produces different keys for different URLs", () => {
      const a = cache.buildKey("https://api.test.com/v1/foo");
      const b = cache.buildKey("https://api.test.com/v1/bar");
      expect(a).not.toBe(b);
    });
  });

  describe("get/set", () => {
    it("returns null on cache miss", () => {
      expect(cache.get("nonexistent")).toBeNull();
    });

    it("returns cached data on hit", () => {
      const data = [{ id: 1, name: "test" }];
      const key = cache.buildKey("https://api.test.com/v1/test");
      cache.set(key, "https://api.test.com/v1/test", data);
      expect(cache.get(key)).toEqual(data);
    });

    it("returns null for expired entry", async () => {
      const shortCache = new ResponseCache(50, cacheDir); // 50ms TTL
      const key = shortCache.buildKey("https://api.test.com/v1/test");
      shortCache.set(key, "https://api.test.com/v1/test", { ok: true });

      // Wait for expiry
      await new Promise((r) => setTimeout(r, 100));
      expect(shortCache.get(key)).toBeNull();
    });

    it("lazily deletes expired cache files", async () => {
      const shortCache = new ResponseCache(50, cacheDir);
      const key = shortCache.buildKey("https://api.test.com/v1/test");
      shortCache.set(key, "https://api.test.com/v1/test", { ok: true });

      // Verify file exists
      expect(readdirSync(cacheDir).length).toBe(1);

      // Wait for expiry, then read (triggers deletion)
      await new Promise((r) => setTimeout(r, 100));
      shortCache.get(key);
      expect(readdirSync(cacheDir).length).toBe(0);
    });

    it("silently handles read errors for missing cache dir", () => {
      const badCache = new ResponseCache(5000, "/tmp/nonexistent-dir-xyz");
      expect(badCache.get("anything")).toBeNull();
    });

    it("creates cache dir on first write if missing", () => {
      const newDir = join(cacheDir, "subdir");
      const newCache = new ResponseCache(5000, newDir);
      const key = newCache.buildKey("https://api.test.com/v1/test");
      newCache.set(key, "https://api.test.com/v1/test", { ok: true });
      expect(newCache.get(key)).toEqual({ ok: true });
    });
  });
});
