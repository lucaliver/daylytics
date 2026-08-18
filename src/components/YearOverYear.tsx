import type { YearOverYearRow } from "../types";
import { Card } from "./Card";
import { MoodFace } from "./MoodFace";

function Delta({ value }: { value: number | null }) {
  // No prior year to compare against (first year in the data) — say
  // nothing rather than a placeholder like "n/a".
  if (value === null) return null;
  // Round first so e.g. -0.3% doesn't print as the confusing "-0%".
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : "";
  return (
    <span
      className="text-sm font-medium"
      style={{ color: rounded >= 0 ? "var(--color-accent)" : "var(--color-negative)" }}
    >
      {sign}
      {rounded}%
    </span>
  );
}

const rowLabelClass =
  "sticky left-0 z-10 w-24 min-w-24 bg-(--color-surface) py-2.5 pr-3 leading-tight text-(--color-text-secondary)";
const cellClass = "px-4 py-2.5 whitespace-nowrap";

export function YearOverYear({ rows, moodOrder }: { rows: YearOverYearRow[]; moodOrder: string[] }) {
  return (
    <Card title="Year over year" subtitle="Each year compared to the one before it">
      {/* See ActivityHeatmap.tsx for why the rounded corner clip lives on
          an outer, non-scrolling wrapper rather than the scroll container
          itself — the sticky first column needs it there to clip cleanly. */}
      <div className="overflow-hidden rounded-xl">
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className={`${rowLabelClass} text-left text-sm font-medium uppercase tracking-wide`}>
                  Year
                </th>
                {rows.map((row) => (
                  <th key={row.year} className={`${cellClass} text-left`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold tracking-tight">{row.year}</span>
                      {row.isPartial && (
                        <span className="rounded-full bg-(--color-border) px-2 py-1 text-sm font-medium uppercase tracking-wide text-(--color-text-secondary)">
                          Partial
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-(--color-border)">
                <td className={rowLabelClass}>Avg mood</td>
                {rows.map((row) => {
                  const moodIndex = Math.round(row.avgMood);
                  return (
                    <td key={row.year} className={cellClass}>
                      <div className="flex items-center gap-1.5">
                        <MoodFace index={moodIndex} total={moodOrder.length} size={16} />
                        <span className="font-semibold">
                          {(row.avgMood + 1).toFixed(2)}/{moodOrder.length}
                        </span>
                        <Delta value={row.avgMoodDeltaPct} />
                      </div>
                    </td>
                  );
                })}
              </tr>
              <tr className="border-t border-(--color-border)">
                <td className={rowLabelClass}>Entries</td>
                {rows.map((row) => (
                  <td key={row.year} className={cellClass}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{row.entryCount}</span>
                      <Delta value={row.entryCountDeltaPct} />
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="border-t border-(--color-border)">
                <td className={rowLabelClass}>Activity diversity</td>
                {rows.map((row) => (
                  <td key={row.year} className={cellClass}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{row.activityDiversity}</span>
                      <Delta value={row.activityDiversityDeltaPct} />
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
