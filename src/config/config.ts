import { config as loadDotenv } from "dotenv";
import { loadConfigFile } from "./store.js";

loadDotenv();

export interface Config {
  apiKey: string;
  baseUrl: string;
  noCache: boolean;
}

export function resolveConfig(opts: {
  apiKey?: string;
  baseUrl?: string;
  cache?: boolean;
}): Config {
  const file = loadConfigFile();

  const apiKey = opts.apiKey || process.env.TOKENOMIST_API_KEY || file.apiKey || "";
  const baseUrl =
    opts.baseUrl || process.env.TOKENOMIST_BASE_URL || file.baseUrl || "https://api.tokenomist.ai";

  if (!apiKey) {
    console.error(
      'Error: API key is required. Run "tok auth login" or provide via --api-key / TOKENOMIST_API_KEY env var.',
    );
    process.exit(1);
  }

  return { apiKey, baseUrl, noCache: opts.cache === false };
}
