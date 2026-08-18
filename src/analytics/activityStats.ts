import type { ActivityYearStat, ScoredEntry } from "../types";

/** For each activity, the % of tracked days per year it appears on — not raw
 * counts, so gaps in logging don't distort the trend (Plan.md Part A §3). */
export function getActivityStats(entries: ScoredEntry[]): ActivityYearStat[] {
  const years = Array.from(new Set(entries.map((e) => e.date.getFullYear()))).sort(
    (a, b) => a - b,
  );

  const trackedDaysByYear = new Map<number, Set<string>>();
  for (const e of entries) {
    const year = e.date.getFullYear();
    if (!trackedDaysByYear.has(year)) trackedDaysByYear.set(year, new Set());
    trackedDaysByYear.get(year)!.add(e.fullDate);
  }

  const activityDaysByYear = new Map<string, Map<number, Set<string>>>();
  for (const e of entries) {
    const year = e.date.getFullYear();
    for (const activity of e.activities) {
      if (!activityDaysByYear.has(activity)) activityDaysByYear.set(activity, new Map());
      const yearMap = activityDaysByYear.get(activity)!;
      if (!yearMap.has(year)) yearMap.set(year, new Set());
      yearMap.get(year)!.add(e.fullDate);
    }
  }

  const stats: ActivityYearStat[] = [];
  for (const [activity, yearMap] of activityDaysByYear) {
    const byYear = years.map((year) => {
      const trackedDays = trackedDaysByYear.get(year)?.size ?? 0;
      const activityDays = yearMap.get(year)?.size ?? 0;
      const pctDays = trackedDays > 0 ? (activityDays / trackedDays) * 100 : 0;
      return { year, pctDays };
    });

    const firstYearWithActivity = byYear.find((y) => y.pctDays > 0);
    const trend =
      byYear.length > 1 && firstYearWithActivity
        ? byYear[byYear.length - 1].pctDays - byYear[0].pctDays
        : 0;

    const totalActivityDays = Array.from(yearMap.values()).reduce(
      (sum, set) => sum + set.size,
      0,
    );
    const totalTrackedDays = Array.from(trackedDaysByYear.values()).reduce(
      (sum, set) => sum + set.size,
      0,
    );
    const overallPctDays =
      totalTrackedDays > 0 ? (totalActivityDays / totalTrackedDays) * 100 : 0;

    stats.push({ activity, byYear, trend, overallPctDays });
  }

  return stats.sort((a, b) => b.overallPctDays - a.overallPctDays);
}
