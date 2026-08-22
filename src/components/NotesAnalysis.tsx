import { Wordcloud } from "@visx/wordcloud";
import { useEffect, useMemo, useRef, useState } from "react";
import type { NoteSearchIndex, NotesAnalysisScope, WordFrequency } from "../types";
import { Card } from "./Card";
import { MoodFace } from "./MoodFace";
import { NoteWordSearch } from "./NoteWordSearch";

const MIN_FONT = 13;
const MAX_FONT = 64;
const CLOUD_FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Vivid, varied hues against the app's dark surface — leans on the accent
// green and info blue already used elsewhere, plus a few extra colors so the
// cloud doesn't read as monochrome the way the old inline word list did.
const CLOUD_COLORS = [
  "#34c471",
  "#5b9bf5",
  "#a78bfa",
  "#2dd4bf",
  "#f0b93a",
  "#f472b6",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Deterministic per word (not Math.random) so the same note text always
// lays out the same way instead of jiggling on every re-render. Mostly
// horizontal for readability, a slice rotated 90°, a few gently tilted —
// the classic word-cloud texture without making most of it hard to read.
function rotationFor(word: string): number {
  const h = hashString(word);
  const bucket = h % 100;
  if (bucket < 70) return 0;
  if (bucket < 88) return 90;
  return (h % 41) - 20;
}

function colorFor(word: string): string {
  return CLOUD_COLORS[hashString(word) % CLOUD_COLORS.length];
}

function useContainerWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.round(w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function WordCloud({
  words,
  onSelect,
}: {
  words: WordFrequency[];
  onSelect: (word: string) => void;
}) {
  const [containerRef, width] = useContainerWidth();
  const height = Math.max(200, Math.min(360, Math.round(width * 0.62)));

  const cloudWords = useMemo(() => words.map((w) => ({ text: w.word, value: w.count })), [words]);

  // d3-cloud's layout effect keys off referential identity of these
  // accessors, so they're memoized on `words` rather than redefined inline —
  // otherwise every unrelated re-render of this card would re-run the
  // layout and reshuffle every word's position.
  const fontSizeAccessor = useMemo(() => {
    const counts = words.map((w) => w.count);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    return (datum: { value: number }) => {
      if (max === min) return (MIN_FONT + MAX_FONT) / 2;
      const t = (Math.sqrt(datum.value) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min));
      return MIN_FONT + t * (MAX_FONT - MIN_FONT);
    };
  }, [words]);
  const rotateAccessor = useMemo(() => (datum: { text: string }) => rotationFor(datum.text), []);

  if (words.length === 0) {
    return (
      <p className="text-sm text-(--color-text-secondary)">
        No notes written in this scope yet.
      </p>
    );
  }

  // Clicking a word searches it, but the cloud stays a single `img` for
  // assistive tech rather than 60 focusable elements: the search box's
  // suggestion list reaches every one of these words by keyboard, and reads
  // their counts out loud while it does.
  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height }}
      role="img"
      aria-label="Most common words, sized by frequency"
    >
      {width > 0 && (
        <Wordcloud
          words={cloudWords}
          width={width}
          height={height}
          padding={3}
          spiral="rectangular"
          rotate={rotateAccessor}
          fontSize={fontSizeAccessor}
          font={CLOUD_FONT_FAMILY}
        >
          {(renderedWords) =>
            renderedWords.map((w, i) => (
              <text
                key={`${w.text ?? i}-${i}`}
                onClick={() => onSelect(w.text ?? "")}
                style={{ cursor: "pointer" }}
                textAnchor="middle"
                transform={`translate(${w.x ?? 0}, ${w.y ?? 0}) rotate(${w.rotate ?? 0})`}
                fontSize={w.size ?? MIN_FONT}
                fontFamily={w.font}
                fontWeight={700}
                fill={colorFor(w.text ?? "")}
              >
                <title>{`${w.text} · ${words.find((word) => word.word === w.text)?.count ?? 0}×`}</title>
                {w.text}
              </text>
            ))
          }
        </Wordcloud>
      )}
    </div>
  );
}

export function NotesAnalysis({
  scopes,
  searchIndex,
  moodOrder,
}: {
  scopes: NotesAnalysisScope[];
  searchIndex: NoteSearchIndex;
  moodOrder: string[];
}) {
  const [tabIndex, setTabIndex] = useState(() => Math.max(0, scopes.length - 1));
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement | null>(null);
  const moodIndex = useMemo(() => new Map(moodOrder.map((m, i) => [m, i])), [moodOrder]);

  // Every word shown in this card is a search shortcut. The results land
  // above the word cloud and the per-mood lists, so scroll back up to them —
  // otherwise a tap looks like it did nothing. Only for a deliberate pick:
  // wired to plain typing it would tug the page on every keystroke, since
  // the scroll margin below puts the panel's top under the sticky header.
  function searchFor(word: string) {
    setQuery(word);
    searchRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  if (scopes.length === 0) return null;
  const active = scopes[Math.min(tabIndex, scopes.length - 1)];
  // Both lists are worst -> best internally (the app-wide convention);
  // shown best -> worst here, same reasoning as the mood-confirm screen.
  const moodsWithWords = [...active.wordsByMood].reverse().filter((m) => m.words.length > 0);
  const lengthByMoodDesc = [...active.avgLengthByMood].reverse();
  const hasSearch = searchIndex.vocabulary.length > 0;
  const maxAvgWords = Math.max(1, ...active.avgLengthByMood.map((m) => m.avgWords));

  return (
    <Card
      title="Notes"
      subtitle={
        hasSearch ? "Search a word, or see the ones you write most" : "The words you write most"
      }
    >
      {hasSearch && (
        <div ref={searchRef} className="mb-6 scroll-mt-24">
          <NoteWordSearch
            index={searchIndex}
            query={query}
            onQueryChange={setQuery}
            onSelectWord={searchFor}
          />
        </div>
      )}

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

      <WordCloud words={active.topWords} onSelect={searchFor} />
      {active.topWords.length > 0 && (
        <p className="mt-2 text-center text-sm text-(--color-text-tertiary)">
          Tap a word to search it.
        </p>
      )}

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
                    <button
                      key={w}
                      type="button"
                      onClick={() => searchFor(w)}
                      className="rounded-full bg-(--color-surface-2) px-2.5 py-0.5 text-sm transition-colors active:bg-(--color-border)"
                    >
                      {w}
                    </button>
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
