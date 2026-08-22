import { splitWords } from "../parser/normalizer";
import type {
  NoteSearchIndex,
  ScoredEntry,
  VocabularyWord,
  WordPosting,
  WordSearchResult,
} from "../types";

const MAX_SUGGESTIONS = 8;
const MAX_COMPANIONS = 6;
/** A word only counts as "written alongside" if it shares at least this
 * many notes with the searched word, and at least this share of them — so a
 * single coincidental pairing can't top the list on lift alone. */
const MIN_COMPANION_NOTES = 3;
const MIN_COMPANION_SHARE = 0.05;
/** Under this many calendar years *spanned*, a year-by-year trend is two
 * bars and says nothing; month buckets carry the shape instead. Measured on
 * the span rather than on how many years contain notes, which also bounds
 * month bucketing at 24 bars — a 2019 note and a 2025 note are two distinct
 * years but seven years of empty months to draw. */
const MIN_YEARS_FOR_YEAR_TREND = 3;

function bump(map: Map<string, number>, key: string, by: number): void {
  map.set(key, (map.get(key) ?? 0) + by);
}

function periodKey(date: Date, granularity: "year" | "month"): string {
  const year = date.getFullYear();
  if (granularity === "year") return String(year);
  return `${year}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Every bucket from `first` to `last` inclusive, including ones with no
 * notes in them — a trend chart that silently skips empty months would draw
 * a gap in tracking as a smooth line. */
function periodRange(first: Date, last: Date, granularity: "year" | "month"): string[] {
  const periods: string[] = [];
  if (granularity === "year") {
    for (let y = first.getFullYear(); y <= last.getFullYear(); y++) periods.push(String(y));
    return periods;
  }
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(last.getFullYear(), last.getMonth(), 1);
  while (cursor <= end) {
    periods.push(periodKey(cursor, "month"));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return periods;
}

/** Puts a search box query through the same character rules as note
 * tokenization, so what someone types can actually match what was indexed.
 * Only the first word survives — the index is word-level, so a phrase has
 * nothing to match against. Unlike the tokenizer this keeps 1-2 letter
 * fragments: they're never indexed words themselves, but they are what
 * someone has typed partway through a longer one, and the suggestion list
 * runs off them. */
export function normalizeQuery(raw: string): string {
  return splitWords(raw)[0] ?? "";
}

/** Builds the inverted index once per dataset. Everything the search box
 * shows is derived from this — a query never rescans the entries. */
export function buildNoteSearchIndex(
  entries: ScoredEntry[],
  moodOrder: string[],
): NoteSearchIndex {
  const notes = entries.filter((e) => e.noteWords.length > 0);
  const postings = new Map<string, WordPosting[]>();
  const notesByMood = new Map<string, number>();
  let moodSum = 0;

  notes.forEach((entry, i) => {
    bump(notesByMood, entry.mood, 1);
    moodSum += entry.moodValue;

    const mentionsHere = new Map<string, number>();
    for (const word of entry.noteWords) bump(mentionsHere, word, 1);
    for (const [word, mentions] of mentionsHere) {
      const list = postings.get(word);
      if (list) list.push({ note: i, mentions });
      else postings.set(word, [{ note: i, mentions }]);
    }
  });

  const vocabulary: VocabularyWord[] = Array.from(postings.entries())
    .map(([word, list]) => ({
      word,
      mentions: list.reduce((a, p) => a + p.mentions, 0),
    }))
    .sort((a, b) => b.mentions - a.mentions || a.word.localeCompare(b.word));

  const first = notes.length > 0 ? notes[0].date : null;
  const last = notes.length > 0 ? notes[notes.length - 1].date : null;
  const spanYears = first && last ? last.getFullYear() - first.getFullYear() + 1 : 0;
  const trendGranularity = spanYears >= MIN_YEARS_FOR_YEAR_TREND ? "year" : "month";
  const trendPeriods = first && last ? periodRange(first, last, trendGranularity) : [];

  const notesByPeriod = new Map<string, number>();
  for (const entry of notes) bump(notesByPeriod, periodKey(entry.date, trendGranularity), 1);

  return {
    notes,
    moodOrder,
    vocabulary,
    postings,
    notesByMood,
    trendGranularity,
    trendPeriods,
    notesByPeriod,
    baselineAvgMood: notes.length > 0 ? moodSum / notes.length : 0,
  };
}

/** Words to offer for a partly-typed query: the exact word first, then ones
 * starting with it, then ones merely containing it — each group already in
 * most-written-first order because the vocabulary is. */
export function suggestWords(
  index: NoteSearchIndex,
  rawQuery: string,
  limit: number = MAX_SUGGESTIONS,
): VocabularyWord[] {
  const query = normalizeQuery(rawQuery);
  if (!query) return [];

  let exact: VocabularyWord | null = null;
  const startsWith: VocabularyWord[] = [];
  const contains: VocabularyWord[] = [];

  for (const word of index.vocabulary) {
    if (word.word === query) exact = word;
    else if (word.word.startsWith(query)) startsWith.push(word);
    else if (word.word.includes(query)) contains.push(word);
  }

  return [...(exact ? [exact] : []), ...startsWith, ...contains].slice(0, limit);
}

/** Everything known about one word: how often it was written, in which
 * moods, how that moved over time, and what else tends to be in the same
 * note. Returns null for a word that was never written. */
export function searchWord(index: NoteSearchIndex, rawWord: string): WordSearchResult | null {
  const word = normalizeQuery(rawWord);
  const postings = word ? index.postings.get(word) : undefined;
  if (!word || !postings || postings.length === 0) return null;

  const totalNotes = index.notes.length;
  let mentions = 0;
  let moodSum = 0;
  const mentionsByMood = new Map<string, number>();
  const notesByMood = new Map<string, number>();
  const mentionsByPeriod = new Map<string, number>();
  const mentionsByPeriodMood = new Map<string, Map<string, number>>();
  const notesByPeriod = new Map<string, number>();
  const companionNotes = new Map<string, number>();

  for (const posting of postings) {
    const entry = index.notes[posting.note];
    mentions += posting.mentions;
    moodSum += entry.moodValue;

    bump(mentionsByMood, entry.mood, posting.mentions);
    bump(notesByMood, entry.mood, 1);

    const period = periodKey(entry.date, index.trendGranularity);
    bump(mentionsByPeriod, period, posting.mentions);
    bump(notesByPeriod, period, 1);

    let perMood = mentionsByPeriodMood.get(period);
    if (!perMood) {
      perMood = new Map();
      mentionsByPeriodMood.set(period, perMood);
    }
    bump(perMood, entry.mood, posting.mentions);

    // Counted once per note, not once per mention: "written alongside" is
    // about which notes two words share, not how often either is repeated.
    for (const other of new Set(entry.noteWords)) {
      if (other !== word) bump(companionNotes, other, 1);
    }
  }

  const byMood = index.moodOrder.map((mood) => {
    const notesInMood = index.notesByMood.get(mood) ?? 0;
    const notesWithWord = notesByMood.get(mood) ?? 0;
    return {
      mood,
      mentions: mentionsByMood.get(mood) ?? 0,
      notes: notesWithWord,
      notesInMood,
      share: notesInMood > 0 ? (notesWithWord / notesInMood) * 100 : 0,
    };
  });

  const byPeriod = index.trendPeriods.map((period) => {
    const notesInPeriod = index.notesByPeriod.get(period) ?? 0;
    const notesWithWord = notesByPeriod.get(period) ?? 0;
    const perMood = mentionsByPeriodMood.get(period);
    return {
      period,
      mentions: mentionsByPeriod.get(period) ?? 0,
      mentionsByMood: Object.fromEntries(
        index.moodOrder.map((mood) => [mood, perMood?.get(mood) ?? 0]),
      ),
      notes: notesWithWord,
      notesInPeriod,
      share: notesInPeriod > 0 ? (notesWithWord / notesInPeriod) * 100 : null,
    };
  });

  // Same "lift" idea as the per-mood word associations in notes.ts: how much
  // more often a word shares a note with this one than it shows up in notes
  // generally. A ratio of frequencies, nothing more.
  const minShared = Math.max(
    MIN_COMPANION_NOTES,
    Math.ceil(postings.length * MIN_COMPANION_SHARE),
  );
  const companions = Array.from(companionNotes.entries())
    .filter(([, shared]) => shared >= minShared)
    .map(([other, shared]) => {
      const overallNotes = index.postings.get(other)?.length ?? 0;
      return {
        word: other,
        notes: shared,
        lift: overallNotes > 0 ? shared / postings.length / (overallNotes / totalNotes) : 0,
      };
    })
    .sort((a, b) => b.lift - a.lift)
    .slice(0, MAX_COMPANIONS);

  return {
    word,
    mentions,
    notes: postings.length,
    totalNotes,
    share: totalNotes > 0 ? (postings.length / totalNotes) * 100 : 0,
    firstSeen: index.notes[postings[0].note].date,
    lastSeen: index.notes[postings[postings.length - 1].note].date,
    avgMood: moodSum / postings.length,
    baselineAvgMood: index.baselineAvgMood,
    byMood,
    byPeriod,
    companions,
  };
}
