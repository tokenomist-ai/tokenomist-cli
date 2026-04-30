import { Command } from "commander";
import { createInterface } from "node:readline";
import {
  loadConfigFile,
  saveConfigFile,
  deleteConfigFile,
  maskApiKey,
  getConfigPath,
} from "../config/store.js";

function readInput(prompt: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export const authCommand = new Command("auth").description("Manage API key authentication");

authCommand
  .command("login")
  .description("Store your API key securely in ~/.tokenomist/config.json")
  .option("--api-key <key>", "API key (will prompt if not provided)")
  .action(async (opts) => {
    let apiKey = opts.apiKey;

    if (!apiKey) {
      apiKey = await readInput("Enter your Tokenomist API key: ");
    }

    if (!apiKey) {
      console.error("Error: API key cannot be empty.");
      process.exit(1);
    }

    const config = loadConfigFile();
    config.apiKey = apiKey;
    saveConfigFile(config);

    console.log(`API key saved to ${getConfigPath()}`);
    console.log(`Key: ${maskApiKey(apiKey)}`);
  });

authCommand
  .command("logout")
  .description("Remove stored API key")
  .action(() => {
    const config = loadConfigFile();
    if (!config.apiKey) {
      console.log("No API key stored.");
      return;
    }

    delete config.apiKey;

    if (Object.keys(config).length === 0) {
      deleteConfigFile();
      console.log(`Removed ${getConfigPath()}`);
    } else {
      saveConfigFile(config);
      console.log("API key removed from config.");
    }
  });

authCommand
  .command("status")
  .description("Show current authentication status")
  .action(() => {
    const envKey = process.env.TOKENOMIST_API_KEY;
    const config = loadConfigFile();
    const fileKey = config.apiKey;

    if (envKey) {
      console.log(`Source:  TOKENOMIST_API_KEY env var`);
      console.log(`Key:     ${maskApiKey(envKey)}`);
    } else if (fileKey) {
      console.log(`Source:  ${getConfigPath()}`);
      console.log(`Key:     ${maskApiKey(fileKey)}`);
    } else {
      console.log("Not authenticated.");
      console.log(`Run "tok auth login" to store your API key.`);
    }
  });
