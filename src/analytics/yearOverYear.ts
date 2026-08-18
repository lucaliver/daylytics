import type { ScoredEntry, YearOverYearRow } from "../types";

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function getYearOverYear(entries: ScoredEntry[]): YearOverYearRow[] {
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
  const rows: YearOverYearRow[] = [];

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const yearEntries = byYear.get(year)!;
    const avgMood =
      yearEntries.reduce((a, e) => a + e.moodValue, 0) / yearEntries.length;
    const activityDiversity = new Set(yearEntries.flatMap((e) => e.activities))
      .size;
    const isPartial =
      (year === firstYear && overallStart.getMonth() !== 0) ||
      (year === firstYear && overallStart.getDate() !== 1) ||
      (year === lastYear &&
        !(overallEnd.getMonth() === 11 && overallEnd.getDate() === 31));

    const prev = i > 0 ? rows[i - 1] : null;
    rows.push({
      year,
      isPartial,
      avgMood,
      entryCount: yearEntries.length,
      activityDiversity,
      avgMoodDeltaPct: prev ? pctDelta(avgMood, prev.avgMood) : null,
      entryCountDeltaPct: prev
        ? pctDelta(yearEntries.length, prev.entryCount)
        : null,
      activityDiversityDeltaPct: prev
        ? pctDelta(activityDiversity, prev.activityDiversity)
        : null,
    });
  }

  return rows;
}
