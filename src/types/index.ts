/** A single normalized Daylio entry. Note/scale *text* is intentionally not
 * carried past parsing — see Plan.md §3. `noteWords` is the one exception:
 * the note tokenized into lowercase words (language-independent, no NLP —
 * Plan.md Tier 1 "Notes word analysis"). It's a one-way transform of the
 * text, not the text itself, so it doesn't reopen full-text search or
 * storage of the original note (both explicit non-goals). */
export interface Entry {
  fullDate: string; // ISO yyyy-mm-dd
  date: Date;
  weekday: string;
  time: string;
  mood: string; // raw label as it appears in the CSV
  activities: string[];
  noteWords: string[];
}

/** An Entry once the mood label → ordinal position mapping is known. */
export interface ScoredEntry extends Entry {
  moodValue: number; // 0 = worst mood, moodOrder.length - 1 = best mood
}

export interface HistoryHeaderData {
  startDate: Date;
  endDate: Date;
  totalDaySpan: number;
  daysTracked: number;
  entriesPerWeek: number;
}

export interface MonthlyMoodPoint {
  month: string; // YYYY-MM
  avgMood: number;
  movingAvg3: number | null;
  count: number;
  totalWords: number;
}

export interface YearlyMoodReference {
  year: number;
  avgMood: number;
}

export interface YearOverYearRow {
  year: number;
  isPartial: boolean;
  avgMood: number;
  entryCount: number;
  activityDiversity: number;
  avgMoodDeltaPct: number | null;
  entryCountDeltaPct: number | null;
  activityDiversityDeltaPct: number | null;
}

export interface ActivityYearStat {
  activity: string;
  byYear: { year: number; pctDays: number }[];
  trend: number; // percentage-point change from first to last year present
  overallPctDays: number;
}

export interface MoodDistributionRow {
  year: number;
  counts: Record<string, number>; // mood label -> count
  percentages: Record<string, number>; // mood label -> 0-100
}

export interface StandoutDaysResult {
  best: ScoredEntry[];
  bestMonth: { month: string; avgMood: number; count: number } | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
}

export interface WordFrequency {
  word: string;
  count: number;
}

/** Notes word analysis for one time scope (a single year, or all time). */
export interface NotesAnalysisScope {
  label: string; // "2024" or "All time"
  topWords: WordFrequency[];
  wordsByMood: { mood: string; words: string[] }[]; // worst -> best, same order as moodOrder
  avgLengthByMood: { mood: string; avgWords: number }[]; // worst -> best
  entriesWithNotes: number; // coverage signal (Plan.md principle 5)
  totalEntries: number;
}

/** One share-card's worth of data: a single calendar year, or "All time".
 * Deliberately excludes anything note-derived — Plan.md Tier 1 "Year in
 * Review export" scopes notes out of the shareable image by default, and
 * this app never sends anything off-device, so what's in here is exactly
 * what a user could end up posting publicly. */
export interface YearInReviewData {
  label: string; // "2024" or "All time"
  year: number | null; // null for "All time"
  isPartial: boolean;
  avgMood: number; // 0 = worst mood, moodOrder.length - 1 = best mood
  avgMoodDeltaPct: number | null; // vs. the previous calendar year; null for "All time" or the first year
  entryCount: number;
  daysTracked: number;
  spanDays: number; // coverage denominator — days actually trackable in this scope (Plan.md principle 5)
  activityDiversity: number;
  moodPercentages: Record<string, number>; // mood label -> 0-100
  topActivities: { activity: string; pctDays: number }[];
  bestDay: { date: Date; moodValue: number } | null;
  monthlySparkline: number[]; // avg mood per month present in scope, chronological
}

export interface DashboardData {
  moodOrder: string[]; // worst -> best
  historyHeader: HistoryHeaderData;
  monthlyMood: MonthlyMoodPoint[];
  yearlyReferences: YearlyMoodReference[];
  yearOverYear: YearOverYearRow[];
  activityStats: ActivityYearStat[];
  moodDistribution: MoodDistributionRow[];
  standoutDays: StandoutDaysResult;
  achievements: Achievement[];
  notesAnalysis: NotesAnalysisScope[];
  yearInReview: YearInReviewData[];
  insights: string[];
}
