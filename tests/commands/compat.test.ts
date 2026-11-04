import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";

// Pins the 0.1.x stdout contract of existing commands: CSV headers keep their
// 0.1.x columns in place (new columns only appended) and JSON stays a bare array.

vi.mock("../../src/api/retry.js", () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

async function freshProgram(): Promise<Command> {
  vi.resetModules();
  const { burnCommand } = await import("../../src/commands/burn.js");
  const { buybackCommand } = await import("../../src/commands/buyback.js");
  const { unlockCommand } = await import("../../src/commands/unlock.js");
  const { emissionCommand } = await import("../../src/commands/emission.js");
  const { investorCommand } = await import("../../src/commands/investor.js");
  return new Command()
    .exitOverride()
    .option("-o, --output <format>", "Output format", "table")
    .option("-k, --api-key <key>")
    .option("--base-url <url>")
    .option("--no-cache")
    .addCommand(burnCommand)
    .addCommand(buybackCommand)
    .addCommand(unlockCommand)
    .addCommand(emissionCommand)
    .addCommand(investorCommand);
}

const PAGE = { page: 1, totalPages: 1, pageSize: 20, total: 1 };

function respond(data: unknown, metadata: Record<string, unknown> = {}) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ metadata, status: true, data }),
  });
}

let stdout: string[];

beforeEach(() => {
  process.env.TOKENOMIST_API_KEY = "test-key";
  process.env.TOKENOMIST_BASE_URL = "https://api.test.com";
  mockFetch.mockReset();
  stdout = [];
  vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => {
    stdout.push(a.join(" "));
  });
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.TOKENOMIST_API_KEY;
  delete process.env.TOKENOMIST_BASE_URL;
});

const run = async (...args: string[]) =>
  (await freshProgram()).parseAsync(["--no-cache", ...args], { from: "user" });

const lines = () => stdout.join("\n").split("\n");

/** The CSV header line must start with the 0.1.x columns, in order. */
function expectHeaderKeeps(header: string, v01: string) {
  expect(header === v01 || header.startsWith(`${v01},`)).toBe(true);
}

const BURN = { tokenId: "aptos", tokenName: "Aptos", tokenSymbol: "APT", totalBurnAmount: 5 };
const BUYBACK = { tokenId: "aave", tokenName: "Aave", tokenSymbol: "AAVE", totalBuybackAmount: 7 };

describe("0.1.x CSV compatibility", () => {
  it("burn list", async () => {
    respond([{ ...BURN, totalBurnValue: 10 }], PAGE);
    await run("-o", "csv", "burn", "list");
    expectHeaderKeeps(lines()[0], "ID,Name,Symbol,Total Burned");
    expect(lines()[1].startsWith("aptos,Aptos,APT,5")).toBe(true);
  });

  it("buyback list", async () => {
    respond([{ ...BUYBACK, totalBuybackValue: 10 }], PAGE);
    await run("-o", "csv", "buyback", "list");
    expectHeaderKeeps(lines()[0], "ID,Name,Symbol,Total Buyback");
  });

  it("burn detail keeps its preamble and header", async () => {
    respond({
      ...BURN,
      totalBurnValue: 10,
      burns: [
        {
          burnEventLabel: "L",
          burnType: "T",
          burnDate: "2026-01-01T00:00:00Z",
          amount: 5,
          pricePerToken: 2,
          value: 10,
          metadata: { burners: [], burnReasons: [] },
        },
      ],
    });
    await run("-o", "csv", "burn", "detail", "aptos");
    const out = lines();
    expect(out.slice(0, 3)).toEqual(["Token: Aptos (APT)", "Total Burned: 5", ""]);
    expectHeaderKeeps(out[3], "Label,Type,Date,Amount");
    expect(out[4].startsWith("L,T,2026-01-01T00:00:00Z,5")).toBe(true);
  });

  it("buyback detail keeps its preamble, header and column positions", async () => {
    respond({
      ...BUYBACK,
      totalBuybackValue: 10,
      buybacks: [
        {
          buybackEventLabel: "L",
          buybackType: "T",
          buybackDate: "2026-01-01T00:00:00Z",
          tokenAmount: 7,
          pricePerToken: 3,
          value: 21,
          spentAmount: 22,
          spentUnit: "USD",
          targetAddress: "",
          buyerAddress: "",
          resolution: "",
          basis: "",
        },
      ],
    });
    await run("-o", "csv", "buyback", "detail", "aave");
    const out = lines();
    expect(out.slice(0, 3)).toEqual(["Token: Aave (AAVE)", "Total Buyback: 7", ""]);
    expectHeaderKeeps(out[3], "Label,Type,Date,Amount,Value,Spent,Unit");
    expect(out[4].startsWith("L,T,2026-01-01T00:00:00Z,7,21,22,USD")).toBe(true);
  });
});

describe("0.1.x JSON compatibility: paginated lists stay bare arrays", () => {
  it.each([
    [["unlock", "list"]],
    [["unlock", "upcoming"]],
    [["unlock", "events", "arbitrum"]],
    [["emission", "daily", "arbitrum"]],
    [["emission", "weekly", "arbitrum"]],
    [["burn", "list"]],
    [["buyback", "list"]],
  ])("%j", async (args) => {
    respond([], { page: 1, totalPages: 1, pageSize: 20 });
    await run("-o", "json", ...args);
    expect(JSON.parse(stdout.join(""))).toEqual([]);
  });

  it("investor list", async () => {
    respond(
      [{ investorId: "a", investorName: "A", website: "", latestFundingDate: "2021-01-01" }],
      PAGE,
    );
    await run("-o", "json", "investor", "list");
    const out = JSON.parse(stdout.join(""));
    expect(Array.isArray(out)).toBe(true);
    expect(out[0].investorId).toBe("a");
  });
});
