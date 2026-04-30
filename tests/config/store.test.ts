import { describe, it, expect } from "vitest";
import { maskApiKey } from "../../src/config/store.js";

describe("maskApiKey", () => {
  it("masks keys longer than 8 chars", () => {
    expect(maskApiKey("abcdefghijklmnop")).toBe("abcd****mnop");
  });

  it("masks short keys entirely", () => {
    expect(maskApiKey("abc")).toBe("****");
    expect(maskApiKey("abcdefgh")).toBe("****");
  });

  it("masks 9-char key correctly", () => {
    expect(maskApiKey("123456789")).toBe("1234****6789");
  });
});
