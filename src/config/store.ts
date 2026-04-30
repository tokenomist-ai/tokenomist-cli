import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".tokenomist");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export interface ConfigFile {
  apiKey?: string;
  baseUrl?: string;
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function loadConfigFile(): ConfigFile {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as ConfigFile;
  } catch {
    return {};
  }
}

export function saveConfigFile(config: ConfigFile): void {
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", {
    encoding: "utf-8",
    mode: 0o600,
  });
}

export function deleteConfigFile(): void {
  try {
    unlinkSync(CONFIG_PATH);
  } catch {
    // file doesn't exist, that's fine
  }
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}
