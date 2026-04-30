import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveConfig } from "../../src/config/config.js";

describe("resolveConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, TOKENOMIST_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("sets noCache to true when cache is false (--no-cache)", () => {
    const config = resolveConfig({ cache: false });
    expect(config.noCache).toBe(true);
  });

  it("sets noCache to false when cache is true (default)", () => {
    const config = resolveConfig({ cache: true });
    expect(config.noCache).toBe(false);
  });

  it("sets noCache to false when cache is undefined", () => {
    const config = resolveConfig({});
    expect(config.noCache).toBe(false);
  });
});
