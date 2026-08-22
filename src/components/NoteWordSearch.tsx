import { useMemo, type ReactNode } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  NoteSearchIndex,
  VocabularyWord,
  WordPeriodStat,
  WordSearchResult,
} from "../types";
import { normalizeQuery, searchWord, suggestWords } from "../analytics/noteSearch";
import { MIN_WORD_LENGTH } from "../parser/normalizer";
import { formatDate, formatMonthShort, formatMonthYear } from "../lib/format";
import { moodColor } from "../lib/color";
import { MoodFace } from "./MoodFace";
import { CloseIcon, SearchIcon } from "./icons";

const MAX_INLINE_SUGGESTIONS = 6;
/** Under this many notes in a mood, its percentage swings wildly on a
 * single entry — 3 of 9 "awful" notes reads as a decisive 33%. Same
 * small-sample caution as the rest of the app (analytics/notes.ts,
 * analytics/monthlyMood.ts): shown, but visibly held at arm's length. */
const LOW_SAMPLE_NOTES = 10;
const SHARE_COLOR = "var(--color-info)";

function WordChip({
  word,
  detail,
  onSelect,
}: {
  word: string;
  detail?: string;
  onSelect: (word: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(word)}
      className="rounded-full bg-(--color-surface-2) px-2.5 py-1 text-sm transition-colors active:bg-(--color-border)"
    >
      {word}
      {detail && <span className="ml-1.5 text-(--color-text-tertiary)">{detail}</span>}
    </button>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5">
      <h4 className="text-sm font-semibold text-(--color-text-secondary)">{title}</h4>
      <p className="mb-3 text-sm text-(--color-text-tertiary)">{hint}</p>
      {children}
    </div>
  );
}

function StatTiles({ result, moodOrder }: { result: WordSearchResult; moodOrder: string[] }) {
  // Rounded before the sign is picked, so a delta of -0.001 doesn't print as
  // a red "−0.00" — the same trap YearOverYear's Delta guards against.
  const delta = Math.round((result.avgMood - result.baselineAvgMood) * 100) / 100;
  const deltaSign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const tiles = [
    {
      label: "Written",
      value: `${result.mentions}×`,
      detail: `in ${result.notes} note${result.notes === 1 ? "" : "s"}`,
    },
    {
      label: "Share of notes",
      value: `${result.share < 1 ? result.share.toFixed(1) : result.share.toFixed(0)}%`,
      detail: `of ${result.totalNotes} notes`,
    },
    {
      // 1-based like every other mood readout in the app: a scale reads
      // "2.4 / 5", not "1.4" (see StandoutDays).
      label: "Avg mood",
      value: `${(result.avgMood + 1).toFixed(2)} / ${moodOrder.length}`,
      detail: (
        <>
          <span
            className="font-medium"
            style={{ color: delta >= 0 ? "var(--color-accent)" : "var(--color-negative)" }}
          >
            {deltaSign}
            {Math.abs(delta).toFixed(2)}
          </span>{" "}
          vs your notes
        </>
      ),
    },
    {
      label: "First written",
      value: formatDate(result.firstSeen),
      detail: `last ${formatDate(result.lastSeen)}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-2xl bg-(--color-surface-2) px-3 py-2.5">
          <p className="text-sm text-(--color-text-secondary)">{tile.label}</p>
          <p className="mt-0.5 text-base font-bold tracking-tight">{tile.value}</p>
          <p className="text-sm text-(--color-text-tertiary)">{tile.detail}</p>
        </div>
      ))}
    </div>
  );
}

function MoodBreakdown({ result, moodOrder }: { result: WordSearchResult; moodOrder: string[] }) {
  const moodIndex = useMemo(() => new Map(moodOrder.map((m, i) => [m, i])), [moodOrder]);
  // Best -> worst, the card's own convention; moods with no notes at all are
  // dropped rather than drawn as an empty row that means nothing.
  const rows = [...result.byMood].reverse().filter((m) => m.notesInMood > 0);
  const maxShare = Math.max(...rows.map((m) => m.share), 0.0001);
  const hasLowSample = rows.some((m) => m.notesInMood < LOW_SAMPLE_NOTES);

  // Bars are a share, not a raw count, on purpose: whichever mood is logged
  // most often would otherwise top this list for every word.
  const hint = `Share of each mood's notes that mention “${result.word}”${
    hasLowSample ? ", dimmed where there are too few notes to read much into" : ""
  }`;

  return (
    <Section title="In each mood" hint={hint}>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.mood}
            className={`flex items-center gap-2.5 ${
              row.notesInMood < LOW_SAMPLE_NOTES ? "opacity-50" : ""
            }`}
            title={`${row.mentions} written across ${row.notes} of your ${row.notesInMood} “${row.mood}” notes`}
          >
            <MoodFace index={moodIndex.get(row.mood) ?? 0} total={moodOrder.length} size={18} />
            <span className="w-16 shrink-0 truncate text-sm text-(--color-text-secondary) sm:w-20">
              {row.mood}
            </span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-(--color-surface-2)">
              <div
                className="h-full rounded-full bg-(--color-accent)"
                style={{ width: `${(row.share / maxShare) * 100}%` }}
              />
            </div>
            <span className="w-[4.5rem] shrink-0 text-right text-sm tabular-nums">
              <span className="font-semibold">{row.mentions}×</span>
              <span className="ml-1 text-(--color-text-tertiary)">{row.share.toFixed(0)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function TrendChart({
  result,
  moodOrder,
  granularity,
}: {
  result: WordSearchResult;
  moodOrder: string[];
  granularity: NoteSearchIndex["trendGranularity"];
}) {
  const byYear = granularity === "year";
  const unit = byYear ? "year" : "month";
  const formatTick = (period: string) => (byYear ? period : formatMonthShort(period));

  // A function dataKey per mood rather than flattening the mood counts onto
  // the datum: mood labels come from the user's own export, so spreading
  // them as top-level keys risks one colliding with `period` or `share`.
  // Memoized because recharts re-runs the stack layout on identity change.
  const moodAccessors = useMemo(
    () => moodOrder.map((mood) => (datum: WordPeriodStat) => datum.mentionsByMood[mood] ?? 0),
    [moodOrder],
  );
  const totalsByPeriod = useMemo(
    () => new Map(result.byPeriod.map((p) => [p.period, p.mentions])),
    [result.byPeriod],
  );

  return (
    <Section
      title={byYear ? "Over the years" : "Month by month"}
      hint={`Times written each ${unit}, colored by the mood you logged it with, and the share of that ${unit}'s notes it appears in`}
    >
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <ComposedChart data={result.byPeriod} margin={{ left: 0, right: 0, top: 6 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="period"
              tickFormatter={formatTick}
              tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              minTickGap={16}
            />
            <YAxis
              yAxisId="mentions"
              allowDecimals={false}
              tick={{ fill: "var(--color-text-secondary)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <YAxis
              yAxisId="share"
              orientation="right"
              domain={[0, (max: number) => Math.ceil(Math.max(max, 1) * 1.25)]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: SHARE_COLOR, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
              }}
              labelStyle={{ color: "var(--color-text-primary)" }}
              labelFormatter={(period: string) => {
                const label = byYear ? period : formatMonthYear(period);
                return `${label} · ${totalsByPeriod.get(period) ?? 0} written`;
              }}
              formatter={(value: number | string, name: string) => {
                // recharts types a datum as string | number, but the share
                // line's nulls (buckets with no notes) reach the formatter
                // as they are.
                if (typeof value !== "number") return ["no notes", name];
                return name === "Share of notes"
                  ? [`${value.toFixed(0)}%`, name]
                  : [`${value}×`, name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "var(--color-text-secondary)" }}
              iconType="circle"
              iconSize={8}
            />
            {/* Worst mood first so it stacks from the bottom up, the same
                worst -> best order the mood axis and composition chart use.
                Square tops throughout: the best mood is often 0 in a given
                bucket, so a rounded cap would land on a zero-height segment
                and only some bars would end up rounded. */}
            {moodOrder.map((mood, i) => (
              <Bar
                key={mood}
                yAxisId="mentions"
                dataKey={moodAccessors[i]}
                name={mood}
                stackId="mentions"
                fill={moodColor(i, moodOrder.length)}
                maxBarSize={26}
              />
            ))}
            {/* Breaks rather than bridges across buckets with no notes at
                all: drawing 0% there would read as "wrote plenty, never this
                word" when nothing was written in the first place. */}
            <Line
              yAxisId="share"
              type="monotone"
              dataKey="share"
              name="Share of notes"
              stroke={SHARE_COLOR}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}

function Result({
  result,
  index,
  related,
  onSelect,
}: {
  result: WordSearchResult;
  index: NoteSearchIndex;
  related: VocabularyWord[];
  onSelect: (word: string) => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-(--color-border) p-4">
      <p className="text-lg font-bold tracking-tight">
        “{result.word}” shows up in {result.notes} of your {result.totalNotes} notes
      </p>

      <div className="mt-3">
        <StatTiles result={result} moodOrder={index.moodOrder} />
      </div>

      <MoodBreakdown result={result} moodOrder={index.moodOrder} />
      <TrendChart
        result={result}
        moodOrder={index.moodOrder}
        granularity={index.trendGranularity}
      />

      {result.companions.length > 0 && (
        <Section
          title="Often written alongside"
          hint="Words that share a note with it more often than they do elsewhere"
        >
          <div className="flex flex-wrap gap-1.5">
            {result.companions.map((c) => (
              <WordChip
                key={c.word}
                word={c.word}
                detail={`${c.notes} notes`}
                onSelect={onSelect}
              />
            ))}
          </div>
        </Section>
      )}

      {related.length > 0 && (
        <Section title="Related words" hint="Other words you wrote that contain this one">
          <div className="flex flex-wrap gap-1.5">
            {related.map((w) => (
              <WordChip key={w.word} word={w.word} detail={`${w.mentions}×`} onSelect={onSelect} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

/** Free-text search over the words kept from notes. The query resolves to a
 * word only on an exact match — a prefix would quietly fold "runny nose"
 * into a search for "run" — so partial input offers suggestions to pick
 * from instead. Suggestions render inline rather than as an overlay
 * dropdown: they're plain buttons in the flow, which keeps them reachable by
 * keyboard and screen reader without a roving-tabindex listbox. */
export function NoteWordSearch({
  index,
  query,
  onQueryChange,
  onSelectWord,
}: {
  index: NoteSearchIndex;
  query: string;
  /** Raw input text, on every keystroke. */
  onQueryChange: (query: string) => void;
  /** A word deliberately picked — a suggestion, a companion, Enter. Kept
   * separate from typing because the parent scrolls the panel into view on
   * a pick, which would be a jolt on every keystroke. */
  onSelectWord: (word: string) => void;
}) {
  const normalized = normalizeQuery(query);
  const result = useMemo(() => searchWord(index, query), [index, query]);
  const suggestions = useMemo(
    () => suggestWords(index, query, MAX_INLINE_SUGGESTIONS + 1),
    [index, query],
  );
  const related = suggestions.filter((s) => s.word !== result?.word).slice(0, MAX_INLINE_SUGGESTIONS);

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          // Enter with a partial word takes the best suggestion, so the
          // common case never needs the mouse.
          if (!result && suggestions.length > 0) onSelectWord(suggestions[0].word);
        }}
      >
        <div className="relative">
          <SearchIcon
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search a word from your notes…"
            aria-label="Search a word from your notes"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="w-full rounded-2xl border border-(--color-border) bg-(--color-surface-2) py-2.5 pl-11 pr-10 text-base outline-none transition-colors placeholder:text-(--color-text-tertiary) focus:border-(--color-accent)"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full p-2 text-(--color-text-tertiary) transition-colors active:bg-(--color-border)"
            >
              <CloseIcon size={15} />
            </button>
          )}
        </div>
      </form>

      {/* Persistent so it actually announces: a live region that mounts with
          its own content is often missed. Silent while a partial word is
          still being typed — the suggestions below are buttons, and reading
          the list out on every keystroke would drown them. */}
      <p role="status" className="sr-only">
        {result
          ? `“${result.word}” appears in ${result.notes} of your ${result.totalNotes} notes.`
          : normalized && suggestions.length === 0
            ? `No note contains “${normalized}”.`
            : ""}
      </p>

      {result ? (
        <Result result={result} index={index} related={related} onSelect={onSelectWord} />
      ) : normalized.length === 0 ? (
        <p className="mt-2.5 text-sm text-(--color-text-tertiary)">
          See how often you wrote a word, which moods you wrote it in, and how that changed —
          across all {index.notes.length} of your notes.
        </p>
      ) : suggestions.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-sm text-(--color-text-tertiary)">
            No note has exactly “{normalized}”. Did you mean:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, MAX_INLINE_SUGGESTIONS).map((w) => (
              <WordChip key={w.word} word={w.word} detail={`${w.mentions}×`} onSelect={onSelectWord} />
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-2.5 text-sm text-(--color-text-tertiary)">
          Nothing in your notes contains “{normalized}”.
          {normalized.length < MIN_WORD_LENGTH &&
            ` Words shorter than ${MIN_WORD_LENGTH} letters aren't counted.`}
        </p>
      )}
    </div>
  );
}
