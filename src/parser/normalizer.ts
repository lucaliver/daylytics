import type { Entry } from "../types";
import type { RawDaylioRow } from "./csvParser";

const MIN_WORD_LENGTH = 3;

/** Tokenizes note text into words, independent of language: strip Daylio's
 * literal `<br>` line breaks, lowercase, split on anything that isn't a
 * Unicode letter/number/apostrophe (so accented and non-Latin scripts split
 * correctly too — not just ASCII), then drop very short tokens and
 * anything with no letters at all (bare numbers). No NLP, no stopword
 * list beyond that — stays correct regardless of what language the note is
 * written in (Plan.md §3, Tier 1 "Notes word analysis"). */
function tokenizeNote(text: string): string[] {
  const cleaned = text.replace(/<br\s*\/?>/gi, " ");
  return cleaned
    .toLowerCase()
    .split(/[^\p{L}\p{N}']+/u)
    .filter((w) => w.length >= MIN_WORD_LENGTH && /\p{L}/u.test(w));
}

/** Converts raw CSV rows into normalized Entry objects. Scale and note text
 * are dropped here on purpose (Plan.md Part A §3) — parsing them fully is
 * future work — but the note's tokenized words are cheap to keep. */
export function normalizeRows(rows: RawDaylioRow[]): Entry[] {
  const entries: Entry[] = [];

  for (const row of rows) {
    const fullDate = (row.full_date ?? "").trim();
    const mood = (row.mood ?? "").trim();
    if (!fullDate || !mood) continue;

    const date = new Date(`${fullDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) continue;

    const activities = (row.activities ?? "")
      .split("|")
      .map((a) => a.trim())
      .filter(Boolean);

    const noteWords = tokenizeNote(`${row.note_title ?? ""} ${row.note ?? ""}`);

    entries.push({
      fullDate,
      date,
      weekday: (row.weekday ?? "").trim(),
      time: (row.time ?? "").trim(),
      mood,
      activities,
      noteWords,
    });
  }

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  return entries;
}
