import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, unlinkSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

interface CacheEntry {
  url: string;
  timestamp: number;
  ttl: number;
  data: unknown;
}

const DEFAULT_CACHE_DIR = join(homedir(), ".tokenomist", "cache");
const MAX_CACHE_FILES = 500;

export class ResponseCache {
  private writeCount = 0;

  constructor(
    private ttl: number = 600_000,
    private cacheDir: string = DEFAULT_CACHE_DIR,
  ) {}

  buildKey(url: string, apiKey?: string): string {
    const parsed = new URL(url);
    parsed.searchParams.sort();
    const prefix = apiKey ? createHash("md5").update(apiKey).digest("hex").slice(0, 8) : "";
    const normalized = `${prefix}:GET:${parsed.toString()}`;
    return createHash("md5").update(normalized).digest("hex");
  }

  get<T>(key: string): T | null {
    try {
      const filePath = join(this.cacheDir, `${key}.json`);
      const raw = readFileSync(filePath, "utf-8");
      const entry = JSON.parse(raw) as CacheEntry;

      if (Date.now() - entry.timestamp > entry.ttl) {
        try {
          unlinkSync(filePath);
        } catch {
          /* ignore */
        }
        return null;
      }

      return entry.data as T;
    } catch {
      return null;
    }
  }

  set(key: string, url: string, data: unknown): void {
    try {
      mkdirSync(this.cacheDir, { recursive: true, mode: 0o700 });
      const entry: CacheEntry = {
        url,
        timestamp: Date.now(),
        ttl: this.ttl,
        data,
      };
      const filePath = join(this.cacheDir, `${key}.json`);
      writeFileSync(filePath, JSON.stringify(entry), { encoding: "utf-8", mode: 0o600 });

      this.writeCount++;
      if (this.writeCount % 20 === 0) this.sweep();
    } catch {
      // Cache is best-effort — silently ignore write failures
    }
  }

  private sweep(): void {
    try {
      const files = readdirSync(this.cacheDir).filter((f) => f.endsWith(".json"));

      // Remove expired entries
      const now = Date.now();
      for (const file of files) {
        try {
          const filePath = join(this.cacheDir, file);
          const raw = readFileSync(filePath, "utf-8");
          const entry = JSON.parse(raw) as CacheEntry;
          if (now - entry.timestamp > entry.ttl) {
            unlinkSync(filePath);
          }
        } catch {
          /* ignore individual file errors */
        }
      }

      // If still over limit, remove oldest entries
      const remaining = readdirSync(this.cacheDir).filter((f) => f.endsWith(".json"));
      if (remaining.length > MAX_CACHE_FILES) {
        const entries = remaining.map((file) => {
          try {
            const filePath = join(this.cacheDir, file);
            const raw = readFileSync(filePath, "utf-8");
            const entry = JSON.parse(raw) as CacheEntry;
            return { file, timestamp: entry.timestamp };
          } catch {
            return { file, timestamp: 0 };
          }
        });
        entries.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = entries.slice(0, entries.length - MAX_CACHE_FILES);
        for (const { file } of toRemove) {
          try {
            unlinkSync(join(this.cacheDir, file));
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* sweep is best-effort */
    }
  }
}
