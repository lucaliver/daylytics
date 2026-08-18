import type { MonthlyMoodPoint, ScoredEntry, StandoutDaysResult } from "../types";
import { getBestMonth } from "./monthlyMood";

const COUNT = 5;

function compareByMood(a: ScoredEntry, b: ScoredEntry, direction: 1 | -1): number {
  if (a.moodValue !== b.moodValue) return direction * (a.moodValue - b.moodValue);
  return b.activities.length - a.activities.length; // richer context ranks first among ties
}

/** The best days by mood. Ties break toward the day with more logged
 * activities, since that's more useful to drill into. */
export function getStandoutDays(
  entries: ScoredEntry[],
  monthlyMood: MonthlyMoodPoint[],
): StandoutDaysResult {
  const best = [...entries].sort((a, b) => compareByMood(a, b, -1)).slice(0, COUNT);
  const bestMonth = getBestMonth(monthlyMood);
  return { best, bestMonth };
}
