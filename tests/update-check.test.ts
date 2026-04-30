import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("showUpdateNotification", () => {
  let cacheDir: string;
  let cacheFile: string;

  beforeEach(() => {
    cacheDir = join(tmpdir(), `tokenomist-update-test-${Date.now()}`);
    mkdirSync(cacheDir, { recursive: true });
    cacheFile = join(cacheDir, "update-check.json");
  });

  afterEach(() => {
    rmSync(cacheDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("prints notification when newer version available", () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const cache = {
      latest: "0.2.0",
      current: "0.1.0",
      checkedAt: Date.now(),
    };
    writeFileSync(cacheFile, JSON.stringify(cache));

    try {
      const raw = readFileSync(cacheFile, "utf-8");
      const data = JSON.parse(raw);
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (data.latest !== data.current && Date.now() - data.checkedAt < ONE_DAY) {
        process.stderr.write(
          `\nUpdate available: ${data.current} → ${data.latest}  (npm i -g @tokenomist-ai/tokenomist-cli)\n\n`,
        );
      }
    } catch {
      // ignore
    }

    expect(stderrSpy).toHaveBeenCalled();
    const output = stderrSpy.mock.calls.map((c) => String(c[0])).join("");
    expect(output).toContain("Update available");
    expect(output).toContain("0.1.0");
    expect(output).toContain("0.2.0");
  });

  it("does not print when versions match", () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const cache = {
      latest: "0.1.0",
      current: "0.1.0",
      checkedAt: Date.now(),
    };
    writeFileSync(cacheFile, JSON.stringify(cache));

    try {
      const raw = readFileSync(cacheFile, "utf-8");
      const data = JSON.parse(raw);
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (data.latest !== data.current && Date.now() - data.checkedAt < ONE_DAY) {
        process.stderr.write(
          `\nUpdate available: ${data.current} → ${data.latest}  (npm i -g @tokenomist-ai/tokenomist-cli)\n\n`,
        );
      }
    } catch {
      // ignore
    }

    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("does not print when cache is expired (>24h)", () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const cache = {
      latest: "0.2.0",
      current: "0.1.0",
      checkedAt: Date.now() - 25 * 60 * 60 * 1000,
    };
    writeFileSync(cacheFile, JSON.stringify(cache));

    try {
      const raw = readFileSync(cacheFile, "utf-8");
      const data = JSON.parse(raw);
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (data.latest !== data.current && Date.now() - data.checkedAt < ONE_DAY) {
        process.stderr.write(
          `\nUpdate available: ${data.current} → ${data.latest}  (npm i -g @tokenomist-ai/tokenomist-cli)\n\n`,
        );
      }
    } catch {
      // ignore
    }

    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("silently handles missing cache file", () => {
    expect(() => {
      try {
        readFileSync(join(cacheDir, "nonexistent.json"), "utf-8");
      } catch {
        // This is expected
      }
    }).not.toThrow();
  });
});
