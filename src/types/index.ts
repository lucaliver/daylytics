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

/** One distinct word written in a note, with how often it was written.
 * Counted per occurrence, the same way the word cloud counts, so the two
 * never disagree about which word you use most. */
export interface VocabularyWord {
  word: string;
  mentions: number;
}

/** Where one word sits in `NoteSearchIndex.notes`: the note's position in
 * that array, and how many times the word appears in it. */
export interface WordPosting {
  note: number;
  mentions: number;
}

/** An inverted index over every word written in a note, built once so the
 * Notes search box can answer "when did I write this, and how did I feel?"
 * without rescanning every entry on each keystroke. Postings point into
 * `notes`, which stays date-sorted — so a word's first and last mention are
 * just its first and last posting. */
export interface NoteSearchIndex {
  notes: ScoredEntry[]; // entries that actually have a note, oldest first
  moodOrder: string[]; // worst -> best
  vocabulary: VocabularyWord[]; // most-written first
  postings: Map<string, WordPosting[]>;
  notesByMood: Map<string, number>; // mood label -> notes written in it
  /** Buckets for the trend chart: every year, or every month for histories
   * too short for a year-by-year view to say anything. Continuous — a
   * bucket with no notes at all is still present, so gaps stay visible. */
  trendGranularity: "year" | "month";
  trendPeriods: string[]; // "2024" or "2024-03", chronological
  notesByPeriod: Map<string, number>;
  baselineAvgMood: number; // avg moodValue across all noted entries
}

/** One mood's slice of a word search: worst -> best, same order as moodOrder. */
export interface WordMoodStat {
  mood: string;
  mentions: number;
  notes: number; // notes in this mood containing the word
  notesInMood: number; // denominator: notes written in this mood at all
  /** 0-100, notes / notesInMood. Plain 0 when the mood carries no notes at
   * all — unlike a period bucket, such a row is dropped before display, so
   * there is no "nothing written" case left to distinguish. */
  share: number;
}

/** One trend bucket's slice of a word search. */
export interface WordPeriodStat {
  period: string; // "2024" or "2024-03"
  mentions: number;
  /** The same mentions split by the mood logged with them — every mood in
   * moodOrder is present, zeros included, so the stacked bars keep a
   * consistent set of series across buckets. Sums to `mentions`. */
  mentionsByMood: Record<string, number>;
  notes: number;
  notesInPeriod: number;
  /** 0-100, notes / notesInPeriod — null where nothing at all was written in
   * the bucket, which is not the same as writing notes and never this word. */
  share: number | null;
}

/** Everything the Notes search box shows for a single searched word. All of
 * it is a plain count or a ratio of counts — descriptive, never a claim
 * that the word caused the mood (Plan.md principle 6). */
export interface WordSearchResult {
  word: string;
  mentions: number;
  notes: number;
  totalNotes: number;
  share: number; // 0-100 of all notes
  firstSeen: Date;
  lastSeen: Date;
  avgMood: number; // avg moodValue of notes containing the word
  baselineAvgMood: number; // avg moodValue across all notes, for comparison
  byMood: WordMoodStat[];
  byPeriod: WordPeriodStat[];
  /** Words that turn up in the same notes more than they do elsewhere. */
  companions: { word: string; notes: number; lift: number }[];
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
  noteSearch: NoteSearchIndex;
  yearInReview: YearInReviewData[];
  insights: string[];
}
