export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Formats a "YYYY-MM" month key (as produced by analytics/monthlyMood.ts)
 * into e.g. "March 2024". */
export function formatMonthYear(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

/** e.g. "Mar 14" — no year, for compact stat labels where the scope already
 * establishes the year (or spans several, where the day/month is the point). */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
