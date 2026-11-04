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
import { pitCommand } from "./commands/pit.js";
import { ApiError, formatApiError } from "./api/errors.js";
import { printWelcome } from "./banner.js";
import { updateNotice } from "./update-notice.js";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import pkg from "../package.json" with { type: "json" };

const ONE_DAY = 24 * 60 * 60 * 1000;

function showUpdateNotification() {
  if (process.env.NO_UPDATE_NOTIFIER === "1" || process.env.CI === "1") return;
  try {
    const raw = readFileSync(join(homedir(), ".tokenomist", "update-check.json"), "utf-8");
    const notice = updateNotice(JSON.parse(raw), pkg.version, Date.now(), ONE_DAY);
    if (notice) process.stderr.write(notice);
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
    "CLI tool for the Tokenomist API — query token unlocks, emissions, fundraising, burns, buybacks, and point-in-time history",
  )
  .version(pkg.version)
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
program.addCommand(pitCommand);
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
      for (const line of formatApiError(err)) console.error(line);
    } else {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    spawnUpdateCheck();
    process.exit(1);
  });
