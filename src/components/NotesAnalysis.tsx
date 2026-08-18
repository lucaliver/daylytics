import { useMemo, useState } from "react";
import type { NotesAnalysisScope, WordFrequency } from "../types";
import { Card } from "./Card";
import { MoodFace } from "./MoodFace";

const MIN_FONT = 13;
const MAX_FONT = 30;

function wordFontSize(count: number, min: number, max: number): number {
  if (max === min) return (MIN_FONT + MAX_FONT) / 2;
  // sqrt rather than linear so one outlier word doesn't dwarf everything else.
  const t = (Math.sqrt(count) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min));
  return MIN_FONT + t * (MAX_FONT - MIN_FONT);
}

function WordCloud({ words }: { words: WordFrequency[] }) {
  if (words.length === 0) {
    return (
      <p className="text-sm text-(--color-text-secondary)">
        No notes written in this scope yet.
      </p>
    );
  }
  const counts = words.map((w) => w.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      {words.map((w) => {
        const size = wordFontSize(w.count, min, max);
        return (
          <span
            key={w.word}
            title={`${w.count}×`}
            style={{ fontSize: `${size}px`, lineHeight: 1 }}
            className={
              size >= (MIN_FONT + MAX_FONT) / 2
                ? "font-bold text-(--color-text-primary)"
                : "font-medium text-(--color-text-secondary)"
            }
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
}

export function NotesAnalysis({
  scopes,
  moodOrder,
}: {
  scopes: NotesAnalysisScope[];
  moodOrder: string[];
}) {
  const [tabIndex, setTabIndex] = useState(() => Math.max(0, scopes.length - 1));
  const moodIndex = useMemo(() => new Map(moodOrder.map((m, i) => [m, i])), [moodOrder]);

  if (scopes.length === 0) return null;
  const active = scopes[Math.min(tabIndex, scopes.length - 1)];
  // Both lists are worst -> best internally (the app-wide convention);
  // shown best -> worst here, same reasoning as the mood-confirm screen.
  const moodsWithWords = [...active.wordsByMood].reverse().filter((m) => m.words.length > 0);
  const lengthByMoodDesc = [...active.avgLengthByMood].reverse();
  const maxAvgWords = Math.max(1, ...active.avgLengthByMood.map((m) => m.avgWords));

  return (
    <Card title="Notes" subtitle="Most common words across your notes">
      <div
        role="tablist"
        aria-label="Time scope"
        className="thin-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1"
      >
        {scopes.map((s, i) => (
          <button
            key={s.label}
            type="button"
            role="tab"
            aria-selected={i === tabIndex}
            onClick={() => setTabIndex(i)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              i === tabIndex
                ? "bg-(--color-accent) text-black"
                : "bg-(--color-surface-2) text-(--color-text-secondary) active:bg-(--color-border)"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-(--color-text-tertiary)">
        Based on {active.entriesWithNotes} of {active.totalEntries} entries with a note.
      </p>

      <WordCloud words={active.topWords} />

      {moodsWithWords.length > 0 && (
        <div className="mt-6 border-t border-(--color-border) pt-4">
          <h3 className="text-sm font-semibold text-(--color-text-secondary)">Words by mood</h3>
          <p className="mb-3 text-sm text-(--color-text-tertiary)">
            Words that show up more than usual for each mood 
          </p>
          <ul className="space-y-2.5">
            {moodsWithWords.map(({ mood, words }) => (
              <li key={mood} className="flex items-start gap-2.5">
                <MoodFace index={moodIndex.get(mood) ?? 0} total={moodOrder.length} size={20} />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {words.map((w) => (
                    <span
                      key={w}
                      className="rounded-full bg-(--color-surface-2) px-2.5 py-0.5 text-sm"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {active.entriesWithNotes > 0 && (
        <div className="mt-6 border-t border-(--color-border) pt-4">
          <h3 className="text-sm font-semibold text-(--color-text-secondary)">
            Note length by mood
          </h3>
          <p className="mb-3 text-sm text-(--color-text-tertiary)">
            Avg number of words per note
          </p>
          <ul className="space-y-2">
            {lengthByMoodDesc.map(({ mood, avgWords }) => (
              <li key={mood} className="flex items-center gap-2.5">
                <MoodFace index={moodIndex.get(mood) ?? 0} total={moodOrder.length} size={18} />
                <span className="w-20 shrink-0 truncate text-sm text-(--color-text-secondary)">
                  {mood}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--color-surface-2)">
                  <div
                    className="h-full rounded-full bg-(--color-accent)"
                    style={{ width: `${(avgWords / maxAvgWords) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-semibold">
                  {avgWords.toFixed(0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
