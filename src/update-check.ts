import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import pkg from "../package.json" with { type: "json" };

const CONFIG_DIR = join(homedir(), ".tokenomist");
const CACHE_PATH = join(CONFIG_DIR, "update-check.json");
const ONE_DAY = 24 * 60 * 60 * 1000;
const REGISTRY_URL = "https://registry.npmjs.org/@tokenomist-ai%2Ftokenomist-cli/latest";

interface UpdateCache {
  latest: string;
  current: string;
  checkedAt: number;
}

async function main() {
  // Check if cache is fresh
  try {
    const raw = readFileSync(CACHE_PATH, "utf-8");
    const cache = JSON.parse(raw) as UpdateCache;
    if (Date.now() - cache.checkedAt < ONE_DAY) {
      return; // Already checked recently
    }
  } catch {
    // No cache or invalid — proceed with check
  }

  const current: string = pkg.version;

  const res = await fetch(REGISTRY_URL, {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return;

  const data = (await res.json()) as { version: string };
  const latest = data.version;

  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });

  const cache: UpdateCache = { latest, current, checkedAt: Date.now() };
  writeFileSync(CACHE_PATH, JSON.stringify(cache), { encoding: "utf-8", mode: 0o600 });
}

main().catch(() => {});
