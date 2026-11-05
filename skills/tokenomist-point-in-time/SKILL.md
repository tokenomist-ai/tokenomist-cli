---
name: tokenomist-point-in-time
description: See a token's tokenomics as published at a past version — allocations, daily emission and cliff unlocks as known on a given date. Use for history, audits, backtests, or explaining how a token's schedule changed over time.
metadata:
  openclaw:
    requires:
      env:
        - TOKENOMIST_API_KEY
      bins:
        - tok
    primaryEnv: TOKENOMIST_API_KEY
    install:
      - kind: node
        package: "@tokenomist-ai/tokenomist-cli"
        bins: [tok]
allowed-tools: Bash(tok:*)
---

# Skill: Point-in-Time History

See a token's tokenomics as it was published at a past version: the versions on its timeline, and its allocations, daily emission and cliff unlock events as known at a given instant.

## When to use

- "What did the unlock schedule look like on 2024-01-01?" (backtests must not use data published later)
- "When and how did this token's tokenomics change?"
- Comparing two versions of a token's schedule.

For the **current** data, use the regular commands (`tok allocation detail`, `tok emission daily`, `tok unlock events`) — they include USD values, which point-in-time answers do not.

## Commands

### List versions
```bash
tok pit versions <tokenId> --output json
```

| Option | Description |
|--------|-------------|
| `--start <date>` | Keep versions valid from this day (YYYY-MM-DD) |
| `--end <date>` | Keep versions valid from up to this day (YYYY-MM-DD) |
| `--page <number>` | Page number |
| `--page-size <number>` | Items per page |

Each version has `id`, `historyOrder`, `status` (`current` / `previous`), `validFrom`, `validUntil`, `previousVersionId`, `change` (`category`, `title`, `description`) and `changeReferences` (sources).

### Data at a version
```bash
tok pit allocation <tokenId> --as-of 2024-01-01 --output json
tok pit daily-emission <tokenId> --as-of 2024-01-01 --start 2024-03-01 --end 2024-03-31 --output json
tok pit unlock-events <tokenId> --version-id <id> --output json
```

| Option | Description |
|--------|-------------|
| `--as-of <instant>` | Answer as known at this instant: `YYYY-MM-DD` or RFC 3339 (`2024-07-01T12:00:00Z`) |
| `--version-id <id>` | Answer from this version (an `id` from `pit versions`) |
| `--start <date>` / `--end <date>` | Date window (daily-emission, unlock-events) |
| `--standard-allocation <names>` | `community`, `founderTeam`, `privateInvestors`, `publicInvestors`, `others`, `reserve` (comma-separated; daily-emission, unlock-events) |
| `--page <number>` / `--page-size <number>` | Pagination (daily-emission, unlock-events) |

Use `--as-of` **or** `--version-id`, never both. With neither, the current version answers.

## Output (`--output json`)

`pit allocation`, `pit daily-emission` and `pit unlock-events`:

```json
{
  "asOf": "2024-01-01T00:00:00Z",
  "version": { "id": "arbitrum-p-…", "historyOrder": 2, "validFrom": "…", "validUntil": "…", "status": "previous" },
  "data": { },
  "pagination": { "page": 1, "totalPages": 3, "pageSize": 20, "total": 45 }
}
```

`pagination` is present on paginated commands only. `pit versions` returns `{ "data", "pagination" }` (no `asOf`/`version`). Walk `--page` until `page` equals `totalPages`.

## Domain Context

- **No USD fields**: point-in-time answers carry amounts only (no `unlockValue`, `cliffValue`, `referencePrice`, `valueToMarketCap`).
- `pit daily-emission` is the **complete supply inflow** per day (cliff + linear) and keeps `totalCumulativeUnlockedAmount` as a running total. `pit unlock-events` is **cliff events only**. Never add the two over the same window (double-counts every cliff).
- Never sum or mix figures across versions; each answer is one version's view.
- Committed claims are kept only when timestamped at or before `asOf`.

## Errors

| Message | Meaning |
|---------|---------|
| `FORBIDDEN: Forbidden` | The plan has no point-in-time access (API, ELITE or TEAM required). |
| `FORBIDDEN (PLAN_NOT_ELIGIBLE)` | `--as-of` is earlier than the plan allows; the message names the plan's range. `Earliest valid date:` (when present) is the first instant inside that range with a version. |
| `… (NO_VERSION_AT_AS_OF)` | The token had no version yet at `--as-of`. `Earliest valid date:` names the first instant with one. |
| `… (VERSION_NOT_FOUND)` | Unknown `--version-id` for this token. |
| `… (INVALID_AS_OF)` | Malformed or future `--as-of`. |
| `… (TOKEN_NOT_FOUND)` | Unknown token ID — resolve it with `tok token search <name>`. |
