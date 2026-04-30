import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PassThrough } from "node:stream";
import { printWelcome } from "../src/banner.js";

type FakeStream = PassThrough & { isTTY?: boolean };

function captureWrites(isTTY: boolean): { stream: FakeStream; output: () => string } {
  const stream = new PassThrough() as FakeStream;
  stream.isTTY = isTTY;
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer | string) => {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf-8"));
  });
  return { stream, output: () => chunks.join("") };
}

describe("printWelcome", () => {
  const savedEnv = { NO_COLOR: process.env.NO_COLOR, FORCE_COLOR: process.env.FORCE_COLOR };

  beforeEach(() => {
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
  });

  afterEach(() => {
    process.env.NO_COLOR = savedEnv.NO_COLOR;
    process.env.FORCE_COLOR = savedEnv.FORCE_COLOR;
    if (savedEnv.NO_COLOR === undefined) delete process.env.NO_COLOR;
    if (savedEnv.FORCE_COLOR === undefined) delete process.env.FORCE_COLOR;
  });

  it("writes banner, getting-started steps, and links", () => {
    const { stream, output } = captureWrites(true);
    printWelcome(stream);
    const out = output();
    expect(out).toContain("Welcome to tokenomist-cli");
    expect(out).toContain("tok auth login");
    expect(out).toContain("tok token list");
    expect(out).toContain("tok token search bitcoin");
    expect(out).toContain("npx skills add tokenomist-ai/tokenomist-cli");
    expect(out).toContain("https://docs.tokenomist.ai/");
    expect(out).toContain("https://github.com/tokenomist-ai/tokenomist-cli/issues");
  });

  it("emits #c51052 truecolor escape when stream is a TTY and NO_COLOR unset", () => {
    const { stream, output } = captureWrites(true);
    printWelcome(stream);
    expect(output()).toContain("\x1b[38;2;197;16;82m");
    expect(output()).toContain("\x1b[0m");
  });

  it("omits color escapes when NO_COLOR is set", () => {
    process.env.NO_COLOR = "1";
    const { stream, output } = captureWrites(true);
    printWelcome(stream);
    expect(output()).not.toContain("\x1b[");
  });

  it("omits color escapes when stream is not a TTY", () => {
    const { stream, output } = captureWrites(false);
    printWelcome(stream);
    expect(output()).not.toContain("\x1b[");
  });

  it("omits color escapes when FORCE_COLOR=0", () => {
    process.env.FORCE_COLOR = "0";
    const { stream, output } = captureWrites(true);
    printWelcome(stream);
    expect(output()).not.toContain("\x1b[");
  });
});
