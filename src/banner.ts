const BANNER_COLOR_OPEN = "\x1b[38;2;197;16;82m";
const COLOR_RESET = "\x1b[0m";

export const BANNER = `████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗ ██████╗ ███╗   ███╗██╗███████╗████████╗
╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║██╔═══██╗████╗ ████║██║██╔════╝╚══██╔══╝
   ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║██║   ██║██╔████╔██║██║███████╗   ██║
   ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║██║   ██║██║╚██╔╝██║██║╚════██║   ██║
   ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██║███████║   ██║
   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═╝╚══════╝   ╚═╝   `;

const WELCOME_LINES = [
  "Welcome to tokenomist-cli v0.1.0",
  "Query token unlocks, emissions, fundraising, burns, and buybacks from the terminal.",
  "",
  " Getting started:",
  "",
  " $ tok auth login                                # store your API key",
  " $ tok token list                                # list all tracked tokens",
  " $ tok token search bitcoin                      # query tokens by name / symbol",
  " $ npx skills add tokenomist-ai/tokenomist-cli   # install AI coding skills",
  " $ tok --help                                    # for view more commands",
  "",
  "Docs:   https://docs.tokenomist.ai/",
  "Site:   https://tokenomist.ai",
  "Issues: https://github.com/tokenomist-ai/tokenomist-cli/issues",
];

function shouldUseColor(stream: NodeJS.WriteStream): boolean {
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== "") return false;
  if (process.env.FORCE_COLOR === "0") return false;
  return Boolean(stream.isTTY);
}

function frame(lines: string[], colored: boolean): string {
  const innerWidth = Math.max(...lines.map((l) => l.length));
  const horizontal = "─".repeat(innerWidth + 2);
  const open = colored ? BANNER_COLOR_OPEN : "";
  const close = colored ? COLOR_RESET : "";
  const top = `${open}╭${horizontal}╮${close}`;
  const bottom = `${open}╰${horizontal}╯${close}`;
  const side = `${open}│${close}`;
  const middle = lines.map((l) => `${side} ${l.padEnd(innerWidth)} ${side}`);
  return [top, ...middle, bottom].join("\n");
}

export function printWelcome(stream: NodeJS.WriteStream): void {
  const colored = shouldUseColor(stream);
  const banner = colored ? `${BANNER_COLOR_OPEN}${BANNER}${COLOR_RESET}` : BANNER;
  stream.write(`${banner}\n\n`);
  stream.write(`${frame(WELCOME_LINES, colored)}\n\n`);
}
