/** True when `latest` is a higher x.y.z than `current` (pre-release tags are ignored). */
export function isNewerVersion(latest: string, current: string): boolean {
  const parse = (v: string) =>
    v
      .replace(/^v/, "")
      .split("-")[0]
      .split(".")
      .map((n) => Number.parseInt(n, 10) || 0);
  const a = parse(latest);
  const b = parse(current);
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

/**
 * The update notice for a cached registry check, or null. Compares against
 * the running version, not the one cached at check time, so an upgrade
 * since the last check (or a build newer than npm) shows no notice.
 */
export function updateNotice(
  cache: { latest?: unknown; checkedAt?: unknown },
  running: string,
  now: number,
  maxAgeMs: number,
): string | null {
  if (typeof cache.latest !== "string" || typeof cache.checkedAt !== "number") return null;
  if (now - cache.checkedAt >= maxAgeMs) return null;
  if (!isNewerVersion(cache.latest, running)) return null;
  return `\nUpdate available: ${running} → ${cache.latest}  (npm i -g @tokenomist-ai/tokenomist-cli)\n\n`;
}
