import { Command } from "commander";
import schema from "../schema.json" with { type: "json" };

export const schemaCommand = new Command("schema")
  .description("Print full command schema as JSON")
  .option("--pretty", "Pretty-print with 2-space indent")
  .action((opts) => {
    const indent = opts.pretty ? 2 : undefined;
    console.log(JSON.stringify(schema, null, indent));
  });
