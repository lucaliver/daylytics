import type { Entry, ScoredEntry } from "../types";

/** Known default Daylio mood-group label sets, worst → best, per locale.
 * This is a best-effort heuristic only — the UI always lets the user confirm
 * or override the order via drag & drop, since custom moods can be anything. */
const KNOWN_ORDERS: string[][] = [
  ["awful", "bad", "meh", "good", "rad"],
  ["orribile", "male", "così così", "bene", "alla grande"],
  ["horrible", "mal", "regular", "bien", "genial"],
  ["horrible", "mauvais", "moyen", "bien", "super"],
  ["schrecklich", "schlecht", "geht so", "gut", "super"],
  ["péssimo", "mau", "mais ou menos", "bom", "ótimo"],
];

/** Best-effort guess at mood order (worst -> best) from the distinct labels
 * present in the data. Falls back to alphabetical if nothing matches. */
export function inferMoodOrder(entries: Entry[]): string[] {
  const distinct = Array.from(new Set(entries.map((e) => e.mood)));
  const normalize = (s: string) => s.trim().toLowerCase();
  const distinctNormalized = new Set(distinct.map(normalize));

  for (const known of KNOWN_ORDERS) {
    if (
      known.length === distinct.length &&
      known.every((label) => distinctNormalized.has(label))
    ) {
      // Preserve the original casing from the data, in the known order.
      return known.map(
        (label) => distinct.find((d) => normalize(d) === label) ?? label,
      );
    }
  }

  return [...distinct].sort((a, b) => a.localeCompare(b));
}

/** Attaches an ordinal moodValue (0 = worst) to each entry given a confirmed order. */
export function applyMoodOrder(entries: Entry[], moodOrder: string[]): ScoredEntry[] {
  const index = new Map(moodOrder.map((mood, i) => [mood, i]));
  return entries
    .filter((e) => index.has(e.mood))
    .map((e) => ({ ...e, moodValue: index.get(e.mood)! }));
}
