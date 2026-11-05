import { describe, it, expect } from "vitest";
import { isNewerVersion, updateNotice } from "../src/update-notice.js";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

describe("isNewerVersion", () => {
  it("compares numerically, not as strings", () => {
    expect(isNewerVersion("0.10.0", "0.9.0")).toBe(true);
    expect(isNewerVersion("0.2.0", "0.1.2")).toBe(true);
  });

  it("is false for the same or an older version", () => {
    expect(isNewerVersion("0.2.0", "0.2.0")).toBe(false);
    expect(isNewerVersion("0.1.2", "0.2.0")).toBe(false);
  });

  it("ignores a leading v and pre-release tags", () => {
    expect(isNewerVersion("v1.0.0", "0.9.9")).toBe(true);
    expect(isNewerVersion("1.0.0-beta.1", "1.0.0")).toBe(false);
  });
});

describe("updateNotice", () => {
  it("names the running version and the newer latest", () => {
    expect(updateNotice({ latest: "0.3.0", checkedAt: NOW }, "0.2.0", NOW, DAY)).toContain(
      "Update available: 0.2.0 → 0.3.0",
    );
  });

  it("stays quiet when the running build is newer than npm", () => {
    expect(updateNotice({ latest: "0.1.2", checkedAt: NOW }, "0.2.0", NOW, DAY)).toBeNull();
  });

  it("uses the running version, not the one cached at check time", () => {
    const cache = { latest: "0.1.2", current: "0.1.1", checkedAt: NOW };
    expect(updateNotice(cache, "0.1.2", NOW, DAY)).toBeNull();
  });

  it("ignores a stale or malformed cache", () => {
    expect(updateNotice({ latest: "9.0.0", checkedAt: NOW - DAY }, "0.2.0", NOW, DAY)).toBeNull();
    expect(updateNotice({ latest: 9, checkedAt: NOW }, "0.2.0", NOW, DAY)).toBeNull();
    expect(updateNotice({}, "0.2.0", NOW, DAY)).toBeNull();
  });
});
