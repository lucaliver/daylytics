import type { MonthlyMoodPoint, ScoredEntry, YearlyMoodReference } from "../types";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthlyMood(entries: ScoredEntry[]): MonthlyMoodPoint[] {
  const byMonth = new Map<string, ScoredEntry[]>();
  for (const e of entries) {
    const key = monthKey(e.date);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e);
  }

  const months = Array.from(byMonth.keys()).sort();
  const points: MonthlyMoodPoint[] = months.map((month) => {
    const monthEntries = byMonth.get(month)!;
    const avgMood =
      monthEntries.reduce((a, e) => a + e.moodValue, 0) / monthEntries.length;
    const totalWords = monthEntries.reduce((a, e) => a + e.noteWords.length, 0);
    return { month, avgMood, movingAvg3: null, count: monthEntries.length, totalWords };
  });

  for (let i = 0; i < points.length; i++) {
    const window = points.slice(Math.max(0, i - 2), i + 1);
    points[i].movingAvg3 =
      window.reduce((a, p) => a + p.avgMood, 0) / window.length;
  }

  return points;
}

/** The single best month by average mood. Months with very few entries are
 * excluded when possible so a month with one lucky day can't win outright. */
export function getBestMonth(points: MonthlyMoodPoint[]): MonthlyMoodPoint | null {
  const MIN_COUNT = 10;
  const eligible = points.filter((p) => p.count >= MIN_COUNT);
  const candidates = eligible.length > 0 ? eligible : points;
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => b.avgMood - a.avgMood)[0];
}

export function getYearlyReferences(entries: ScoredEntry[]): YearlyMoodReference[] {
  const byYear = new Map<number, number[]>();
  for (const e of entries) {
    const year = e.date.getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(e.moodValue);
  }

  return Array.from(byYear.entries())
    .map(([year, values]) => ({
      year,
      avgMood: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => a.year - b.year);
}
