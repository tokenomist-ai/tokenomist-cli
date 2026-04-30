import { describe, it, expect, vi, afterEach } from "vitest";
import { isSkillInstalled, hasTTY, hasNpx } from "../../scripts/postinstall.js";

describe("postinstall helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isSkillInstalled", () => {
    it("returns false when skill directories do not exist", () => {
      const originalHome = process.env.HOME;
      process.env.HOME = "/tmp/fake-home-nonexistent";
      expect(isSkillInstalled()).toBe(false);
      process.env.HOME = originalHome;
    });
  });

  describe("hasTTY", () => {
    it("returns a boolean", () => {
      expect(typeof hasTTY()).toBe("boolean");
    });
  });

  describe("hasNpx", () => {
    it("returns true when npx is available", () => {
      // npx is available in the test environment (comes with node/npm)
      expect(hasNpx()).toBe(true);
    });
  });
});
