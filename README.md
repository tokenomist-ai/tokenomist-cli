# tokenomist-cli

[![npm version](https://img.shields.io/npm/v/@tokenomist-ai/tokenomist-cli.svg)](https://www.npmjs.com/package/@tokenomist-ai/tokenomist-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CLI tool for the [Tokenomist API](https://tokenomist.ai) — query token unlocks, emissions, fundraising, burns, and buybacks from the terminal.

## Quick Start

```bash
npm install -g @tokenomist-ai/tokenomist-cli
tok auth login
tok token list
```

Or run without installing:

```bash
npx @tokenomist-ai/tokenomist-cli token list
```

> **Requirements:** Node.js 18+ and a Tokenomist API key — get one at [tokenomist.ai](https://tokenomist.ai).

## Authentication

Get an API key from [tokenomist.ai](https://tokenomist.ai) and configure it.

### `tok auth login` (recommended)

```bash
tok auth login
# Enter your Tokenomist API key: ****

# Or pass directly:
tok auth login --api-key your-api-key
```

This stores your key in `~/.tokenomist/config.json` with restricted file permissions (`0600`).

### Check auth status

```bash
tok auth status
# Source:  ~/.tokenomist/config.json
# Key:     tk-t****ab2f
```

### Remove stored key

```bash
tok auth logout
```

### Alternative methods

**Environment variable**
```bash
export TOKENOMIST_API_KEY=your-api-key
```

**`.env` file in project directory**
```
TOKENOMIST_API_KEY=your-api-key
```

**CLI flag (per-command)**
```bash
tok token list --api-key your-api-key
```

### Resolution order

`--api-key` flag > `TOKENOMIST_API_KEY` env var > `~/.tokenomist/config.json`

## AI Skills

Tokenomist CLI ships with AI coding skills that let agents (Claude Code, Cursor, Windsurf, etc.) query tokenomics data on your behalf.

### Install skills

```bash
npx skills add tokenomist-ai/tokenomist-cli
```

### Install skills locally (after cloning)

If you've cloned the repo for development, install skills from your local copy:

```bash
npx skills add .
```

This reads the skill definitions from the local `.agents/skills/` directory instead of fetching from the registry.

### Available skills

| Skill | Description |
|-------|-------------|
| `tokenomist-token-overview` | Browse all tracked tokens with market data |
| `tokenomist-unlock-analysis` | Analyze upcoming and historical token unlocks |
| `tokenomist-emission-report` | Daily/weekly emission data with allocation breakdowns |
| `tokenomist-fundraising-lookup` | Fundraising rounds, investors, and valuations |
| `tokenomist-burn-buyback` | Token burn and buyback activity |
| `tokenomist-allocation-breakdown` | Full allocation distribution for a token |
| `tokenomist-point-in-time` | Tokenomics as published at a past version (history, audits, backtests) |

## Usage

### Token list
```bash
tok token list
tok token list --output csv
```

### Unlock events
```bash
tok unlock list
tok unlock list --min-market-cap 1000000
tok unlock upcoming
tok unlock events solana --start 2024-01-01 --end 2024-12-31
```

### Investors
```bash
tok investor list
tok investor detail <investorId>
tok investor detail <investorId> --is-lead-investor
```

### Fundraising
```bash
tok fundraising detail solana
tok fundraising detail solana --output json
```

### Burns
```bash
tok burn list
tok burn detail solana --start 2024-01-01
```

### Buybacks
```bash
tok buyback list
tok buyback detail solana
```

### Emissions
```bash
tok emission daily solana
tok emission weekly solana --start 2024-01-01 --end 2024-06-30
```

### Allocations
```bash
tok allocation detail solana
```

### Point-in-time history
A token's data as it was published at a past version. Select the version with `--as-of` (a date or RFC 3339 instant) or `--version-id` (from `pit versions`), not both; omit both for the current version. Point-in-time answers carry no USD fields. Requires a plan with point-in-time access (API, ELITE or TEAM).

```bash
tok pit versions arbitrum
tok pit allocation arbitrum --as-of 2024-01-01
tok pit daily-emission arbitrum --as-of 2024-01-01 --start 2024-03-01 --end 2024-03-31
tok pit unlock-events arbitrum --version-id <versionId> --output json
```

With `--output json`, `pit allocation`, `pit daily-emission` and `pit unlock-events` return `{ "asOf", "version", "data", "pagination" }` (`pagination` on the two series commands only); `pit versions` returns `{ "data", "pagination" }`.

### Pagination
Unlock, emission, investor list, burn list, buyback list, `pit versions` and the `pit` series commands return one page (20 rows by default). The page position is printed to **stderr**, so stdout stays clean for `--output json` / `csv`:

```
Page 1/2 · 28 total · next: --page 2 (or raise --page-size)
```

Use `--page` / `--page-size` to get the rest. A page past the last returns the last page again.

## Global Options

| Option | Description |
|--------|-------------|
| `-k, --api-key <key>` | Override API key |
| `-o, --output <format>` | Output format: `table` (default), `json`, `csv` |
| `--base-url <url>` | Override API base URL (default: `https://api.tokenomist.ai`) |
| `--no-cache` | Bypass the 10-minute response cache |
| `-V, --version` | Print version |
| `-h, --help` | Show help |

## Development

```bash
git clone https://github.com/tokenomist-ai/tokenomist-cli.git
cd tokenomist-cli
npm install
npm run build
npm test

# Link for local testing
npm link
tok --help
```

## License

[MIT](LICENSE)
