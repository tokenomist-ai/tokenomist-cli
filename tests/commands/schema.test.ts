import { describe, it, expect } from "vitest";
import schema from "../../src/schema.json" with { type: "json" };
import pkg from "../../package.json" with { type: "json" };

describe("schema.json", () => {
  it("has name and version", () => {
    expect(schema.name).toBe("tok");
    expect(schema.version).toBe(pkg.version);
  });

  it("has globalOptions", () => {
    expect(schema.globalOptions).toBeDefined();
    expect(schema.globalOptions["api-key"]).toBeDefined();
    expect(schema.globalOptions["output"]).toBeDefined();
    expect(schema.globalOptions["no-cache"]).toBeDefined();
  });

  it("has all expected commands", () => {
    const commands = Object.keys(schema.commands);
    expect(commands).toContain("token list");
    expect(commands).toContain("token search <query>");
    expect(commands).toContain("unlock list");
    expect(commands).toContain("unlock upcoming");
    expect(commands).toContain("unlock events <tokenId>");
    expect(commands).toContain("investor list");
    expect(commands).toContain("investor detail <investorId>");
    expect(commands).toContain("fundraising detail <tokenId>");
    expect(commands).toContain("burn list");
    expect(commands).toContain("burn detail <tokenId>");
    expect(commands).toContain("buyback list");
    expect(commands).toContain("buyback detail <tokenId>");
    expect(commands).toContain("emission daily <tokenId>");
    expect(commands).toContain("emission weekly <tokenId>");
    expect(commands).toContain("allocation detail <tokenId>");
    expect(commands).toContain("pit versions <tokenId>");
    expect(commands).toContain("pit allocation <tokenId>");
    expect(commands).toContain("pit daily-emission <tokenId>");
    expect(commands).toContain("pit unlock-events <tokenId>");
    expect(commands).toContain("auth login");
    expect(commands).toContain("auth logout");
    expect(commands).toContain("auth status");
    expect(commands).toContain("schema");
  });

  it("each command has description and example", () => {
    for (const [name, cmd] of Object.entries(schema.commands)) {
      const c = cmd as Record<string, unknown>;
      expect(c.description, `${name} missing description`).toBeTruthy();
      expect(c.example, `${name} missing example`).toBeTruthy();
    }
  });

  it("unlock list has all 9 filter options", () => {
    const opts = schema.commands["unlock list"].options;
    expect(Object.keys(opts)).toHaveLength(9);
    expect(opts["min-market-cap"]).toBeDefined();
    expect(opts["min-released-percentage"]).toBeDefined();
    expect(opts["min-total-unlock-amount"]).toBeDefined();
    expect(opts["page"]).toBeDefined();
    expect(opts["page-size"]).toBeDefined();
  });

  it("unlock upcoming has V5 filter options with start/end instead of min/max unlock date", () => {
    const upcomingOpts = schema.commands["unlock upcoming"].options;
    expect(Object.keys(upcomingOpts)).toHaveLength(9);
    expect(upcomingOpts["start"]).toBeDefined();
    expect(upcomingOpts["end"]).toBeDefined();
    expect(upcomingOpts["standard-allocation"]).toBeDefined();
    expect(upcomingOpts["min-market-cap"]).toBeDefined();
    expect(upcomingOpts["page"]).toBeDefined();
    expect(upcomingOpts["page-size"]).toBeDefined();
  });
});
