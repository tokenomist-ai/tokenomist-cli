import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";

vi.mock("../../src/api/retry.js", () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Commander keeps parsed option values on a command instance, so each test
// builds its program from freshly imported command modules.
async function freshProgram(): Promise<Command> {
  vi.resetModules();
  const { pitCommand } = await import("../../src/commands/pit.js");
  const { burnCommand } = await import("../../src/commands/burn.js");
  return new Command()
    .exitOverride()
    .option("-o, --output <format>", "Output format", "table")
    .option("-k, --api-key <key>")
    .option("--base-url <url>")
    .option("--no-cache")
    .addCommand(pitCommand)
    .addCommand(burnCommand);
}

function respond(body: unknown) {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => body });
}

function calledUrl(): URL {
  return new URL(mockFetch.mock.calls[0][0] as string);
}

const VERSION = {
  id: "arbitrum-p-65dfeebe513917073c6e97a9",
  historyOrder: 3,
  validFrom: "2024-02-18T04:27:11Z",
  validFromBasis: "stated_in_document",
  validUntil: null,
  previousVersionId: "arbitrum-p-6502a0ab2e1d22b626158232",
  status: "current",
};

describe("pit commands", () => {
  let stdout: string[];
  let stderr: string[];

  beforeEach(() => {
    process.env.TOKENOMIST_API_KEY = "test-key";
    process.env.TOKENOMIST_BASE_URL = "https://api.test.com";
    mockFetch.mockReset();
    stdout = [];
    stderr = [];
    vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => {
      stdout.push(a.join(" "));
    });
    vi.spyOn(process.stdout, "write").mockImplementation((c: string | Uint8Array) => {
      stdout.push(String(c));
      return true;
    });
    vi.spyOn(process.stderr, "write").mockImplementation((c: string | Uint8Array) => {
      stderr.push(String(c));
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.TOKENOMIST_API_KEY;
    delete process.env.TOKENOMIST_BASE_URL;
  });

  const run = async (...args: string[]) =>
    (await freshProgram()).parseAsync(["--no-cache", ...args], { from: "user" });

  it("versions: calls the route with filters and prints a page hint to stderr", async () => {
    respond({
      metadata: { page: 1, totalPages: 2, pageSize: 2, total: 3 },
      status: true,
      data: [
        {
          id: "arbitrum-p-1",
          tokenId: "arbitrum",
          historyOrder: 1,
          status: "previous",
          validFrom: "2023-03-16T13:08:18Z",
          validFromBasis: "stated_in_document",
          validUntil: "2023-10-10T01:40:11Z",
          disclosedAt: "2023-03-16T13:08:18Z",
          previousVersionId: null,
          change: {
            category: "baseline",
            title: "Launch tokenomics",
            description: null,
            basis: "x",
          },
          changeReferences: [],
          dataSource: "Whitepaper",
        },
      ],
    });

    await run("pit", "versions", "arbitrum", "--start", "2023-01-01", "--page-size", "2");

    const url = calledUrl();
    expect(url.pathname).toBe("/v5/point-in-time/token-versions/arbitrum");
    expect(url.searchParams.get("start")).toBe("2023-01-01");
    expect(url.searchParams.get("pageSize")).toBe("2");
    expect(url.searchParams.get("showError")).toBe("true");
    expect(stdout.join("")).toContain("Launch tokenomics");
    expect(stderr.join("")).toContain("Page 1/2 · 3 total · next: --page 2");
  });

  it("allocation --output json wraps data with asOf and version", async () => {
    const data = {
      name: "Arbitrum",
      symbol: "ARB",
      maxSupply: 10_000_000_000,
      totalUnlockedAmount: 1,
      totalLockedAmount: 2,
      totalUntrackedAmount: 0,
      totalTBDLockedAmount: 3,
      allocations: [],
    };
    respond({
      metadata: { asOf: "2025-01-01T00:00:00Z", version: VERSION },
      status: true,
      data,
    });

    await run("-o", "json", "pit", "allocation", "arbitrum", "--as-of", "2025-01-01");

    expect(calledUrl().searchParams.get("asOf")).toBe("2025-01-01");
    expect(JSON.parse(stdout.join(""))).toEqual({
      asOf: "2025-01-01T00:00:00Z",
      version: VERSION,
      data,
    });
    expect(stderr).toEqual([]);
  });

  it("daily-emission rejects --as-of with --version-id before any request", async () => {
    await expect(
      run("pit", "daily-emission", "arbitrum", "--as-of", "2025-01-01", "--version-id", "x"),
    ).rejects.toThrow("Use either --as-of or --version-id, not both");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("daily-emission rejects a reversed range before any request", async () => {
    await expect(
      run("pit", "daily-emission", "arbitrum", "--start", "2025-02-01", "--end", "2025-01-01"),
    ).rejects.toThrow("--start 2025-02-01 is after --end 2025-01-01");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("unlock-events maps every option and includes pagination in json", async () => {
    respond({
      metadata: {
        asOf: "2026-11-04T00:00:00Z",
        version: VERSION,
        page: 2,
        totalPages: 2,
        pageSize: 5,
        total: 6,
      },
      status: true,
      data: [],
    });

    await run(
      "-o",
      "json",
      "pit",
      "unlock-events",
      "arbitrum",
      "--version-id",
      VERSION.id,
      "--start",
      "2024-01-01",
      "--end",
      "2024-12-31",
      "--standard-allocation",
      "founderTeam,privateInvestors",
      "--page",
      "2",
      "--page-size",
      "5",
    );

    const url = calledUrl();
    expect(url.pathname).toBe("/v5/point-in-time/unlock/events/arbitrum");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      versionId: VERSION.id,
      start: "2024-01-01",
      end: "2024-12-31",
      standardAllocation: "founderTeam,privateInvestors",
      page: "2",
      pageSize: "5",
      showError: "true",
    });
    expect(JSON.parse(stdout.join(""))).toEqual({
      asOf: "2026-11-04T00:00:00Z",
      version: VERSION,
      data: [],
      pagination: { page: 2, totalPages: 2, pageSize: 5, total: 6 },
    });
  });

  it("unlock-events csv keeps stdout to the csv and the version on stderr", async () => {
    respond({
      metadata: {
        asOf: "2026-11-04T00:00:00Z",
        version: VERSION,
        page: 1,
        totalPages: 1,
        pageSize: 20,
        total: 1,
      },
      status: true,
      data: [
        {
          unlockDate: "2024-03-16T00:00:00Z",
          tokenName: "Arbitrum",
          tokenSymbol: "ARB",
          listedMethod: "INTERNAL",
          dataSource: "Whitepaper",
          cliffUnlocks: {
            cliffAmount: 1_000,
            allocationBreakdown: [
              {
                unlockDate: "2024-03-16T00:00:00Z",
                allocationName: "Investors",
                standardAllocationName: "Private Investors",
                cliffAmount: 600,
                unlockPrecision: "day",
                committedClaim: null,
              },
              {
                unlockDate: "2024-03-16T00:00:00Z",
                allocationName: "Team",
                standardAllocationName: "Founder / Team",
                cliffAmount: 400,
                unlockPrecision: "day",
                committedClaim: null,
              },
            ],
          },
        },
      ],
    });

    await run("-o", "csv", "pit", "unlock-events", "arbitrum");

    expect(stdout.join("")).toBe(
      "Date,Symbol,Cliff Amount,Allocations\n2024-03-16T00:00:00Z,ARB,1000,Investors; Team",
    );
    expect(stderr.join("")).toContain(`Version: ${VERSION.id} (current)`);
    expect(stderr.join("")).toContain("Page 1/1 · 1 total");
  });
});

describe("legacy paginated commands keep their stdout shape", () => {
  let stdout: string[];
  let stderr: string[];

  beforeEach(() => {
    process.env.TOKENOMIST_API_KEY = "test-key";
    process.env.TOKENOMIST_BASE_URL = "https://api.test.com";
    mockFetch.mockReset();
    stdout = [];
    stderr = [];
    vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => {
      stdout.push(a.join(" "));
    });
    vi.spyOn(process.stderr, "write").mockImplementation((c: string | Uint8Array) => {
      stderr.push(String(c));
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.TOKENOMIST_API_KEY;
    delete process.env.TOKENOMIST_BASE_URL;
  });

  it("burn list --output json is still the bare array; the page hint goes to stderr", async () => {
    const rows = [
      {
        tokenId: "aptos",
        tokenName: "Aptos",
        tokenSymbol: "APT",
        totalBurnAmount: 1,
        totalBurnValue: 2,
      },
    ];
    respond({
      metadata: { page: 1, totalPages: 14, pageSize: 2, total: 28 },
      status: true,
      data: rows,
    });

    await (
      await freshProgram()
    ).parseAsync(["--no-cache", "-o", "json", "burn", "list", "--page-size", "2"], {
      from: "user",
    });

    expect(JSON.parse(stdout.join(""))).toEqual(rows);
    expect(stderr.join("")).toBe("Page 1/14 · 28 total · next: --page 2 (or raise --page-size)\n");
  });

  it("burn list table shows the USD total", async () => {
    respond({
      metadata: { page: 1, totalPages: 1, pageSize: 20, total: 1 },
      status: true,
      data: [
        {
          tokenId: "aptos",
          tokenName: "Aptos",
          tokenSymbol: "APT",
          totalBurnAmount: 1,
          totalBurnValue: 4602943.22,
        },
      ],
    });

    await (await freshProgram()).parseAsync(["--no-cache", "burn", "list"], { from: "user" });

    expect(stdout.join("")).toContain("Total Value (USD)");
    expect(stdout.join("")).toContain("4,602,943.22");
  });
});
