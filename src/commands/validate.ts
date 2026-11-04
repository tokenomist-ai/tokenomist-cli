/**
 * Client-side checks for inputs the API accepts silently. Emission, the
 * investor list and the point-in-time routes answer a reversed range with an
 * empty list instead of an error, which reads as "no data".
 */

/** Throw when both bounds are set and `start` is after `end` (YYYY-MM-DD compares lexically). */
export function validateDateRange(
  start: string | undefined,
  end: string | undefined,
  names: [string, string] = ["--start", "--end"],
): void {
  if (start && end && start > end) {
    throw new Error(`${names[0]} ${start} is after ${names[1]} ${end}`);
  }
}

/** Throw when both a point-in-time `--as-of` and `--version-id` are given. */
export function validateVersionSelector(asOf: string | undefined, versionId: string | undefined) {
  if (asOf && versionId) {
    throw new Error("Use either --as-of or --version-id, not both");
  }
}
