import type { ActivityYearStat, YearOverYearRow } from "../types";

/** Daylio counts moods from 1, not 0 — a 5-mood scale reads "4.42/5", never
 * "3.42/4" — so displayed (as opposed to internally stored) mood values
 * always add 1 back on. */
function formatMood(value: number, moodOrder: string[]): string {
  return (value + 1).toFixed(2) + `/${moodOrder.length}`;
}

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatOrdinalDate(date: Date): string {
  const month = date.toLocaleDateString(undefined, { month: "long" });
  return `${ordinal(date.getDate())} ${month} ${date.getFullYear()}`;
}

/** The next occurrence of the tracking-start month/day, however many years
 * out that lands. */
function getAnniversaryInsight(startDate: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next = new Date(startDate);
  next.setFullYear(now.getFullYear());
  if (next.getTime() < today.getTime()) next.setFullYear(now.getFullYear() + 1);

  const years = next.getFullYear() - startDate.getFullYear();
  if (years < 1) return "";

  return `On ${formatOrdinalDate(next)}, it'll be your ${ordinal(years)} Daylio anniversary!`;
}

/** Deterministic, text-based observations. No AI/LLM involved (Plan.md Part
 * A §3) — every line here is derived directly from the already-computed
 * year-over-year and activity stats. */
export function getInsights(
  yearOverYear: YearOverYearRow[],
  activityStats: ActivityYearStat[],
  moodOrder: string[],
  startDate: Date,
): string[] {
  const insights: string[] = [];

  const fullYears = yearOverYear.filter((y) => !y.isPartial);
  const candidateYears = fullYears.length > 0 ? fullYears : yearOverYear;
  const bestYear = [...candidateYears].sort((a, b) => b.avgMood - a.avgMood)[0];
  if (bestYear) {
    insights.push(
      `${bestYear.year} was your best-tracked year for mood, averaging ${formatMood(bestYear.avgMood, moodOrder)}${bestYear.isPartial ? " (partial year)" : ""}.`,
    );
  }

  // Comparing entry counts is only fair between two full years — a year
  // still in progress will always look "down" against a completed one.
  let biggestEntryChange: YearOverYearRow | null = null;
  for (let i = 0; i < yearOverYear.length; i++) {
    const row = yearOverYear[i];
    if (row.entryCountDeltaPct === null || row.isPartial || yearOverYear[i - 1]?.isPartial) {
      continue;
    }
    if (!biggestEntryChange || Math.abs(row.entryCountDeltaPct!) > Math.abs(biggestEntryChange.entryCountDeltaPct!)) {
      biggestEntryChange = row;
    }
  }
  if (biggestEntryChange) {
    // Round before signing so a tiny negative (e.g. -0.3%) can't print the
    // confusing "-0%" — see the analogous fix in YearOverYear.tsx. A round
    // of exactly zero isn't an interesting "biggest change" to report.
    const rounded = Math.round(biggestEntryChange.entryCountDeltaPct!);
    if (rounded !== 0) {
      const sign = rounded > 0 ? "+" : "-";
      insights.push(
        `Logging activity in ${biggestEntryChange.year} changed ${sign}${Math.abs(rounded)}% vs. the year before.`,
      );
    }
  }

  const meaningfulActivities = activityStats.filter((a) => a.byYear.length > 1);
  const mostImproved = [...meaningfulActivities].sort((a, b) => b.trend - a.trend)[0];
  if (mostImproved && mostImproved.trend > 1) {
    insights.push(
      `"${mostImproved.activity}" climbed the most: +${mostImproved.trend.toFixed(0)}% of tracked days from first year to last.`,
    );
  }

  const mostDeclined = [...meaningfulActivities].sort((a, b) => a.trend - b.trend)[0];
  if (mostDeclined && mostDeclined.trend < -1) {
    insights.push(
      `"${mostDeclined.activity}" faded the most: ${mostDeclined.trend.toFixed(0)}% of tracked days from first year to last.`,
    );
  }

  const stableCandidates = meaningfulActivities.filter((a) => a.overallPctDays > 5);
  const mostStable = [...stableCandidates].sort(
    (a, b) => Math.abs(a.trend) - Math.abs(b.trend),
  )[0];
  if (mostStable) {
    insights.push(
      `"${mostStable.activity}" has been the most consistent habit, holding steady at around ${mostStable.overallPctDays.toFixed(0)}% of tracked days.`,
    );
  }

  const anniversary = getAnniversaryInsight(startDate);
  if (anniversary) insights.push(anniversary);

  return insights.slice(0, 6);
}
