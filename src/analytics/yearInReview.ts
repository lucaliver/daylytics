import type { ScoredEntry, YearInReviewData } from "../types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TOP_ACTIVITIES = 4;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

function summarize(
  scopeEntries: ScoredEntry[],
  label: string,
  year: number | null,
  spanDays: number,
  isPartial: boolean,
  moodOrder: string[],
  prevAvgMood: number | null,
): YearInReviewData {
  const avgMood = scopeEntries.reduce((a, e) => a + e.moodValue, 0) / scopeEntries.length;
  const daysTracked = new Set(scopeEntries.map((e) => e.fullDate)).size;

  const moodCounts: Record<string, number> = Object.fromEntries(moodOrder.map((m) => [m, 0]));
  for (const e of scopeEntries) moodCounts[e.mood] = (moodCounts[e.mood] ?? 0) + 1;
  const moodPercentages: Record<string, number> = {};
  for (const mood of moodOrder) {
    moodPercentages[mood] = (moodCounts[mood] / scopeEntries.length) * 100;
  }

  const activityDays = new Map<string, Set<string>>();
  for (const e of scopeEntries) {
    for (const activity of e.activities) {
      if (!activityDays.has(activity)) activityDays.set(activity, new Set());
      activityDays.get(activity)!.add(e.fullDate);
    }
  }
  const topActivities = Array.from(activityDays.entries())
    .map(([activity, days]) => ({
      activity,
      pctDays: daysTracked > 0 ? (days.size / daysTracked) * 100 : 0,
    }))
    .sort((a, b) => b.pctDays - a.pctDays)
    .slice(0, TOP_ACTIVITIES);

  // Best day of the scope — same tie-break as analytics/standoutDays.ts
  // (richer context ranks first), recomputed locally since that module's
  // version isn't scoped to a single year.
  let bestDay: ScoredEntry | null = null;
  for (const e of scopeEntries) {
    if (
      !bestDay ||
      e.moodValue > bestDay.moodValue ||
      (e.moodValue === bestDay.moodValue && e.activities.length > bestDay.activities.length)
    ) {
      bestDay = e;
    }
  }

  const byMonth = new Map<string, number[]>();
  for (const e of scopeEntries) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e.moodValue);
  }
  const monthlySparkline = Array.from(byMonth.keys())
    .sort()
    .map((key) => {
      const values = byMonth.get(key)!;
      return values.reduce((a, b) => a + b, 0) / values.length;
    });

  return {
    label,
    year,
    isPartial,
    avgMood,
    avgMoodDeltaPct:
      prevAvgMood !== null && prevAvgMood !== 0 ? ((avgMood - prevAvgMood) / prevAvgMood) * 100 : null,
    entryCount: scopeEntries.length,
    daysTracked,
    spanDays,
    activityDiversity: activityDays.size,
    moodPercentages,
    topActivities,
    bestDay: bestDay ? { date: bestDay.date, moodValue: bestDay.moodValue } : null,
    monthlySparkline,
  };
}

/** One shareable-card summary per calendar year present in the data, plus
 * an "All time" scope — same per-year-plus-all-time scoping already used by
 * analytics/notes.ts, so the share tab picker (YearInReview.tsx) feels
 * consistent with the Notes tab picker. */
export function getYearInReview(entries: ScoredEntry[], moodOrder: string[]): YearInReviewData[] {
  if (entries.length === 0) return [];

  const overallStart = entries[0].date;
  const overallEnd = entries[entries.length - 1].date;
  const firstYear = overallStart.getFullYear();
  const lastYear = overallEnd.getFullYear();

  const byYear = new Map<number, ScoredEntry[]>();
  for (const e of entries) {
    const year = e.date.getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(e);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => a - b);

  const results: YearInReviewData[] = [];
  let prevAvgMood: number | null = null;
  for (const year of years) {
    const rangeStart = year === firstYear && overallStart > new Date(year, 0, 1) ? overallStart : new Date(year, 0, 1);
    const rangeEnd = year === lastYear && overallEnd < new Date(year, 11, 31) ? overallEnd : new Date(year, 11, 31);
    const spanDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / MS_PER_DAY) + 1;
    const isPartial = spanDays < daysInYear(year);

    const row = summarize(byYear.get(year)!, String(year), year, spanDays, isPartial, moodOrder, prevAvgMood);
    results.push(row);
    prevAvgMood = row.avgMood;
  }

  const totalSpanDays = Math.round((overallEnd.getTime() - overallStart.getTime()) / MS_PER_DAY) + 1;
  results.push(summarize(entries, "All time", null, totalSpanDays, false, moodOrder, null));

  return results;
}
