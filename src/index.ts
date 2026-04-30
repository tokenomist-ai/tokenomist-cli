import { Command } from "commander";
import { tokenCommand } from "./commands/token.js";
import { unlockCommand } from "./commands/unlock.js";
import { investorCommand } from "./commands/investor.js";
import { fundraisingCommand } from "./commands/fundraising.js";
import { burnCommand } from "./commands/burn.js";
import { buybackCommand } from "./commands/buyback.js";
import { emissionCommand } from "./commands/emission.js";
import { allocationCommand } from "./commands/allocation.js";
import { authCommand } from "./commands/auth.js";
import { schemaCommand } from "./commands/schema.js";
import { ApiError } from "./api/errors.js";
import { printWelcome } from "./banner.js";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const ONE_DAY = 24 * 60 * 60 * 1000;

function showUpdateNotification() {
  if (process.env.NO_UPDATE_NOTIFIER === "1" || process.env.CI === "1") return;
  try {
    const raw = readFileSync(join(homedir(), ".tokenomist", "update-check.json"), "utf-8");
    const data = JSON.parse(raw);
    if (data.latest !== data.current && Date.now() - data.checkedAt < ONE_DAY) {
      process.stderr.write(
        `\nUpdate available: ${data.current} → ${data.latest}  (npm i -g @tokenomist-ai/tokenomist-cli)\n\n`,
      );
    }
  } catch {
    // No cache file or invalid — skip silently
  }
}

function showWelcomeBanner(): boolean {
  if (process.env.TOKENOMIST_NO_BANNER === "1") return false;
  if (process.env.CI === "1") return false;
  if (!process.stderr.isTTY) return false;
  if (process.argv.length > 2) return false;
  printWelcome(process.stderr);
  return true;
}

function spawnUpdateCheck() {
  if (process.env.NO_UPDATE_NOTIFIER === "1" || process.env.CI === "1") return;
  try {
    const script = fileURLToPath(new URL("./update-check.js", import.meta.url));
    spawn("node", [script], { detached: true, stdio: "ignore" }).unref();
  } catch {
    // Spawn failure — skip silently
  }
}

const program = new Command();

program
  .name("tok")
  .description(
    "CLI tool for the Tokenomist API — query token unlocks, emissions, fundraising, burns, and buybacks",
  )
  .version("0.1.0")
  .option("-k, --api-key <key>", "API key (overrides env/config)")
  .option("-o, --output <format>", "Output format: table, json, csv", "table")
  .option("--base-url <url>", "API base URL")
  .option("--no-cache", "Bypass response cache");

program.addCommand(tokenCommand);
program.addCommand(unlockCommand);
program.addCommand(investorCommand);
program.addCommand(fundraisingCommand);
program.addCommand(burnCommand);
program.addCommand(buybackCommand);
program.addCommand(emissionCommand);
program.addCommand(allocationCommand);
program.addCommand(authCommand);
program.addCommand(schemaCommand);

if (showWelcomeBanner()) {
  spawnUpdateCheck();
  process.exit(0);
}

showUpdateNotification();

program
  .parseAsync(process.argv)
  .then(() => {
    spawnUpdateCheck();
  })
  .catch((err) => {
    if (err instanceof ApiError) {
      if (err.retriesExhausted) {
        // Retry log lines already printed to stderr; just show detail if present
        if (err.detail) console.error(`Detail: ${err.detail}`);
      } else {
        console.error(`${err.code}: ${err.message}`);
        if (err.detail) console.error(`Detail: ${err.detail}`);
      }
    } else {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    spawnUpdateCheck();
    process.exit(1);
  });
