import type { NotesAnalysisScope, ScoredEntry, WordFrequency } from "../types";

const MAX_TOP_WORDS = 60;
const MAX_WORDS_PER_MOOD = 4;
// A word needs at least this many mentions within a mood to be considered
// for "words associated with this mood" — otherwise one rare word used
// only a couple of times looks artificially "distinctive" purely from
// small-sample noise.
const MIN_MOOD_WORD_COUNT = 5;

function countWords(entries: ScoredEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const w of e.noteWords) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return counts;
}

function topWords(counts: Map<string, number>, limit: number): WordFrequency[] {
  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function analyzeScope(
  entries: ScoredEntry[],
  label: string,
  moodOrder: string[],
): NotesAnalysisScope {
  const overallCounts = countWords(entries);
  const totalWordsOverall = entries.reduce((a, e) => a + e.noteWords.length, 0);

  const wordsByMood: NotesAnalysisScope["wordsByMood"] = [];
  const avgLengthByMood: NotesAnalysisScope["avgLengthByMood"] = [];

  for (const mood of moodOrder) {
    const moodEntries = entries.filter((e) => e.mood === mood);
    const moodCounts = countWords(moodEntries);
    const totalWordsInMood = moodEntries.reduce((a, e) => a + e.noteWords.length, 0);

    // "Lift": how much more often a word shows up in this mood's notes than
    // in notes overall. Purely a frequency ratio — descriptive, not a
    // sentiment or causal claim (Plan.md principle 6).
    const words = Array.from(moodCounts.entries())
      .filter(([, count]) => count >= MIN_MOOD_WORD_COUNT)
      .map(([word, count]) => {
        const freqInMood = count / totalWordsInMood;
        const freqOverall = (overallCounts.get(word) ?? 0) / totalWordsOverall;
        return { word, lift: freqOverall > 0 ? freqInMood / freqOverall : 0 };
      })
      .sort((a, b) => b.lift - a.lift)
      .slice(0, MAX_WORDS_PER_MOOD)
      .map((c) => c.word);

    wordsByMood.push({ mood, words });
    avgLengthByMood.push({
      mood,
      avgWords: moodEntries.length > 0 ? totalWordsInMood / moodEntries.length : 0,
    });
  }

  return {
    label,
    topWords: topWords(overallCounts, MAX_TOP_WORDS),
    wordsByMood,
    avgLengthByMood,
    entriesWithNotes: entries.filter((e) => e.noteWords.length > 0).length,
    totalEntries: entries.length,
  };
}

/** Word frequency, per-mood word associations, and note length vs. mood —
 * computed once per year present in the data plus an "All time" scope, so
 * switching tabs in the UI is just picking an already-computed entry, no
 * recomputation. */
export function getNotesAnalysis(
  entries: ScoredEntry[],
  moodOrder: string[],
): NotesAnalysisScope[] {
  const years = Array.from(new Set(entries.map((e) => e.date.getFullYear()))).sort(
    (a, b) => a - b,
  );
  const scopes = years.map((year) =>
    analyzeScope(
      entries.filter((e) => e.date.getFullYear() === year),
      String(year),
      moodOrder,
    ),
  );
  scopes.push(analyzeScope(entries, "All time", moodOrder));
  return scopes;
}
