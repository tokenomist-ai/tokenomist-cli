# Changelog

## 0.2.0

### Added

- `tok pit` (alias `tok point-in-time`): a token's tokenomics as published at a past version, from the `/v5/point-in-time` routes.
  - `pit versions <tokenId>` lists the versions on the token's project timeline.
  - `pit allocation`, `pit daily-emission` and `pit unlock-events <tokenId>` answer from the version selected by `--as-of <instant>` or `--version-id <id>` (one or the other; neither = current version). No USD fields.
  - `--output json` returns `{ asOf, version, data, pagination? }` (`pit versions`: `{ data, pagination }`).
  - Needs a plan with point-in-time access (API, ELITE or TEAM).
- Paginated commands print the page position to stderr (`Page 1/2 · 28 total · next: --page 2`). Before, nothing showed that only the first page (20 rows by default) had been returned. Stdout is unchanged, so `--output json|csv` pipes keep working.
- `burn list` / `buyback list` show `totalBurnValue` / `totalBuybackValue` (USD). `burn detail` / `buyback detail` show per-event `pricePerToken` (burn also `value`), and the USD total in table mode. New table/CSV columns are appended after the existing ones, so 0.1.x CSV column positions and headers are unchanged.
- Errors show the API's `errorDetail` guidance (requests now send `showError=true`), point-in-time `errorCode` and `earliestValidDate`, and per-field messages of `422` validation errors.

### Changed

- `400` errors are reported as `BAD_REQUEST` and `422` errors as `VALIDATION_ERROR` (were `UNKNOWN`).
- A reversed date range (`--start` after `--end`, and the min/max variants) is rejected before the request. Some endpoints answered it with an empty list, which read as "no data".
- `investor list` shows `—` in the Rounds column (`roundCount: null` in JSON) instead of `0`: the list endpoint does not return funding rounds. Use `investor detail` for them.

### Fixed

- `tok --version` and `tok schema` reported `0.1.0` whatever the installed version.
- An empty page sent as `"data": null` no longer crashes list commands.
- After the last retry of a 429, 5xx or network error, the CLI now prints a final line (`… (gave up after 3 attempts)`) instead of ending on "Retrying…". Retry lines also show the point-in-time `errorCode`.
- `burn detail` / `buyback detail` report a total USD value of `0` when no event matches the date range. The API sends `null` there, which showed as `—` next to `Total Burned: 0`.
- The update notice now shows only when npm has a newer version than the one running. Before, it compared for inequality against the version cached at check time, so it could suggest an older version or name the version you had already upgraded from.


## 0.1.0

- Initial release
- Support for all 15 Tokenomist API endpoints
- Output formats: table, JSON, CSV
- API key configuration via flag, env var, or config file
