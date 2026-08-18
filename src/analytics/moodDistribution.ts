import type { MoodDistributionRow, ScoredEntry } from "../types";

export function getMoodDistribution(
  entries: ScoredEntry[],
  moodOrder: string[],
): MoodDistributionRow[] {
  const byYear = new Map<number, ScoredEntry[]>();
  for (const e of entries) {
    const year = e.date.getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(e);
  }

  return Array.from(byYear.entries())
    .map(([year, yearEntries]) => {
      const counts: Record<string, number> = Object.fromEntries(
        moodOrder.map((m) => [m, 0]),
      );
      for (const e of yearEntries) counts[e.mood] = (counts[e.mood] ?? 0) + 1;

      const percentages: Record<string, number> = {};
      for (const mood of moodOrder) {
        percentages[mood] = (counts[mood] / yearEntries.length) * 100;
      }

      return { year, counts, percentages };
    })
    .sort((a, b) => a.year - b.year);
}
