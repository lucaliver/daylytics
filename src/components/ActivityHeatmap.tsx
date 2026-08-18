import { useMemo, useState } from "react";
import type { ActivityYearStat } from "../types";
import { Card } from "./Card";
import { SortIcon } from "./icons";

type SortMode = "frequency" | "increase" | "decrease" | "alphabetical";

const SORTERS: Record<SortMode, (a: ActivityYearStat, b: ActivityYearStat) => number> = {
  frequency: (a, b) => b.overallPctDays - a.overallPctDays,
  increase: (a, b) => b.trend - a.trend,
  decrease: (a, b) => a.trend - b.trend,
  alphabetical: (a, b) => a.activity.localeCompare(b.activity),
};

// Two-hue scale (red -> green) rather than one hue faded by opacity — low
// values stay clearly visible/colored instead of fading toward invisible
// against the dark background.
const HEATMAP_LOW: [number, number, number] = [229, 72, 77]; // --color-negative
const HEATMAP_HIGH: [number, number, number] = [52, 196, 113]; // --color-accent

function cellStyle(pct: number): { background: string; color: string } {
  if (pct <= 0) return { background: "transparent", color: "var(--color-text-tertiary)" };
  const t = Math.min(pct, 100) / 100;
  const [r, g, b] = HEATMAP_LOW.map((c, i) => Math.round(c + (HEATMAP_HIGH[i] - c) * t));
  return { background: `rgb(${r}, ${g}, ${b})`, color: "#0d1410" };
}

export function ActivityHeatmap({ stats }: { stats: ActivityYearStat[] }) {
  const [sortMode, setSortMode] = useState<SortMode>("frequency");
  const years = stats[0]?.byYear.map((y) => y.year) ?? [];

  const sorted = useMemo(() => [...stats].sort(SORTERS[sortMode]), [stats, sortMode]);

  return (
    <Card
      title="Activity heatmap"
      subtitle="% of tracked days each activity appears on, per year"
      action={
        <div className="flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface-2) pl-3 pr-1">
          <SortIcon size={14} className="shrink-0 text-(--color-text-secondary)" />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            aria-label="Sort activities by"
            className="bg-transparent py-1.5 pr-2 text-sm text-(--color-text-primary)"
          >
            <option value="frequency">Frequency</option>
            <option value="increase">Increasing</option>
            <option value="decrease">Decreasing</option>
            <option value="alphabetical">A to Z</option>
          </select>
        </div>
      }
    >
      {/* A rounded `overflow: hidden` outer wrapper, with the actual
          scrolling on an unrounded inner div — `position: sticky` children
          (the frozen row/column headers below) can paint past a scrolling
          ancestor's own border-radius in Chromium/WebKit, so the corner
          clipping has to happen one level up from the scroll container. */}
      <div className="overflow-hidden rounded-xl">
        <div className="thin-scrollbar max-h-[28rem] overflow-x-auto overflow-y-auto">
          <div
            className="grid min-w-fit gap-y-1"
            style={{ gridTemplateColumns: `minmax(9rem, 1fr) repeat(${years.length}, 3.25rem)` }}
          >
            <div className="sticky top-0 left-0 z-20 bg-(--color-surface) py-1 text-sm font-medium text-(--color-text-secondary)">
              Activity
            </div>
            {years.map((year) => (
              <div
                key={year}
                className="sticky top-0 z-10 bg-(--color-surface) py-1 text-center text-sm font-medium text-(--color-text-secondary)"
              >
                {year}
              </div>
            ))}

            {sorted.map((activity) => (
              <div key={activity.activity} className="contents">
                <div className="sticky left-0 z-10 truncate bg-(--color-surface) py-1 pr-2 text-sm">
                  {activity.activity}
                </div>
                {activity.byYear.map(({ year, pctDays }) => {
                  const style = cellStyle(pctDays);
                  return (
                    <div
                      key={year}
                      title={`${pctDays.toFixed(0)}%`}
                      className="m-0.5 flex items-center justify-center rounded-lg text-sm font-medium"
                      style={{ ...style, height: "1.9rem" }}
                    >
                      {pctDays > 0 ? `${pctDays.toFixed(0)}` : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
