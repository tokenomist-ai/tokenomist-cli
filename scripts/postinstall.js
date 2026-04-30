#!/usr/bin/env node

/**
 * Post-install onboarding for tokenomist-cli.
 *
 * Runs after `npm install -g @tokenomist-ai/tokenomist-cli` and offers to install
 * AI coding skills via `npx skills add tokenomist-ai/tokenomist-cli`.
 *
 * Non-interactive environments (CI, piped stdin) get a one-liner tip instead.
 * Always exits 0 — onboarding failures must never break installation.
 */

import { execFileSync, spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createInterface } from "readline";
import { fileURLToPath } from "url";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

const SKILL_REPO = "tokenomist-ai/tokenomist-cli";

function log(msg = "") {
  process.stderr.write(`  ${msg}\n`);
}

export function hasTTY() {
  return !!(process.stdin.isTTY && process.stderr.isTTY);
}

export function hasNpx() {
  try {
    execFileSync("npx", ["--version"], {
      stdio: "ignore",
      shell: process.platform === "win32",
    });
    return true;
  } catch {
    return false;
  }
}

export function isSkillInstalled() {
  const home = homedir();
  const locations = [join(home, ".claude", "skills", "tokenomist-cli")];
  return locations.some((loc) => existsSync(loc));
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    let answered = false;
    rl.on("close", () => {
      if (!answered) resolve("");
    });
    rl.question(question, (answer) => {
      answered = true;
      rl.close();
      resolve(answer.trim());
    });
  });
}

function runCommand(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("close", (code) => resolve(code === 0));
    child.on("error", () => resolve(false));
  });
}

async function installSkill() {
  if (isSkillInstalled()) {
    log(`${GREEN}✓${RESET} Tokenomist skills already installed.`);
    return;
  }

  if (!hasNpx()) {
    log(
      `${DIM}Tip: Run 'npx skills add ${SKILL_REPO}' to install Tokenomist AI coding skills.${RESET}`,
    );
    return;
  }

  log(`Tokenomist skills let AI coding agents (Claude Code, Cursor, etc.) query`);
  log(`token unlocks, emissions, fundraising, burns, and allocations on your behalf.`);
  const answer = await prompt(`  Install Tokenomist skills for your AI coding agent? [Y/n] `);

  if (/^n/i.test(answer)) {
    log(`Skipped. You can install later with: ${CYAN}npx skills add ${SKILL_REPO}${RESET}`);
    return;
  }

  log(`Installing Tokenomist skills...`);
  const ok = await runCommand("npx", ["-y", "skills", "add", SKILL_REPO]);
  if (!ok) {
    log(
      `${YELLOW}Skill installation failed. You can retry with: npx skills add ${SKILL_REPO}${RESET}`,
    );
  }
}

async function main() {
  // Only run for global installs. When npm runs this as a postinstall hook
  // during local `npm install` or `npm ci`, skip to avoid breaking CI.
  // When invoked directly (`node scripts/postinstall.js`), npm_lifecycle_event
  // is undefined, so the guard does not trigger — allowing manual execution.
  if (
    process.env.npm_lifecycle_event === "postinstall" &&
    process.env.npm_config_global !== "true"
  ) {
    return;
  }

  log();

  if (!hasTTY()) {
    log(`${BOLD}Tokenomist CLI installed!${RESET}`);
    log();
    log(`Tip: Run '${CYAN}npx skills add ${SKILL_REPO}${RESET}' to install AI coding skills.`);
    log(`Tip: Run '${CYAN}tok auth login${RESET}' to authenticate.`);
    return;
  }

  log(`${BOLD}Tokenomist CLI installed!${RESET}`);
  log();

  await installSkill();

  log();
}

// Only auto-run when executed as the entry point, not when imported for testing
const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isEntryPoint) {
  main().catch(() => {
    // Never fail installation due to onboarding errors
  });
}
