import { useState } from "react";
import type { ScoredEntry, StandoutDaysResult } from "../types";
import { Card } from "./Card";
import { MoodFace } from "./MoodFace";
import { EntryDetailDialog } from "./EntryDetailDialog";
import { formatDate, formatMonthYear } from "../lib/format";

function DayRow({
  entry,
  moodOrder,
  onSelect,
}: {
  entry: ScoredEntry;
  moodOrder: string[];
  onSelect: (entry: ScoredEntry) => void;
}) {
  return (
    <button
      onClick={() => onSelect(entry)}
      className="flex w-full items-center gap-3 rounded-xl bg-(--color-surface-2) px-3 py-2.5 text-left transition-colors active:bg-(--color-border)"
    >
      <MoodFace index={entry.moodValue} total={moodOrder.length} size={26} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{formatDate(entry.date)}</p>
        <p className="truncate text-sm text-(--color-text-secondary)">
          {entry.activities.length > 0 ? entry.activities.join(", ") : "No activities logged"}
        </p>
      </div>
    </button>
  );
}

function DayList({
  entries,
  moodOrder,
  onSelect,
}: {
  entries: ScoredEntry[];
  moodOrder: string[];
  onSelect: (entry: ScoredEntry) => void;
}) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {entries.map((entry) => (
        <li key={entry.fullDate}>
          <DayRow entry={entry} moodOrder={moodOrder} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}

export function StandoutDays({
  standoutDays,
  moodOrder,
}: {
  standoutDays: StandoutDaysResult;
  moodOrder: string[];
}) {
  const [selected, setSelected] = useState<ScoredEntry | null>(null);
  const { bestMonth } = standoutDays;
  const now = new Date();
  const isCurrentMonth =
    bestMonth?.month === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <Card title="Best days" subtitle="Your highest-mood days. Tap one for details.">
      {bestMonth && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-(--color-accent-dim) bg-(--color-accent)/10 px-4 py-3.5">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-(--color-accent)">
              Best month ever
            </p>
            <p className="text-lg font-bold tracking-tight">
              {formatMonthYear(bestMonth.month)}
              {isCurrentMonth && (
                <span className="ml-1.5 text-sm font-normal text-(--color-text-tertiary)">
                  (still going)
                </span>
              )}
            </p>
          </div>
          <p className="text-sm text-(--color-text-secondary)">
            avg {(bestMonth.avgMood + 1).toFixed(2)}/{moodOrder.length}
          </p>
        </div>
      )}
      <DayList entries={standoutDays.best} moodOrder={moodOrder} onSelect={setSelected} />
      <EntryDetailDialog entry={selected} moodOrder={moodOrder} onClose={() => setSelected(null)} />
    </Card>
  );
}
