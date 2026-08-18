import { useState } from "react";
import type { ActivityYearStat } from "../types";
import { Card } from "./Card";
import { Sparkline } from "./Sparkline";

type TabId = "rising" | "falling" | "consistent";

function ActivityList({ items, color }: { items: ActivityYearStat[]; color: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-(--color-text-secondary)">Not enough data yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li
          key={a.activity}
          className="flex items-center justify-between gap-3 rounded-xl bg-(--color-surface-2) px-3 py-2.5"
        >
          <span className="truncate text-sm">{a.activity}</span>
          <div className="flex items-center gap-3">
            <Sparkline values={a.byYear.map((y) => y.pctDays)} color={color} />
            <span className="w-14 text-right text-sm font-semibold" style={{ color }}>
              {/* Round first so e.g. -0.3 doesn't print as the confusing "-0%". */}
              {Math.round(a.trend) > 0 ? "+" : ""}
              {Math.round(a.trend)}%
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ActivityChanges({ stats }: { stats: ActivityYearStat[] }) {
  const [tab, setTab] = useState<TabId>("rising");

  const eligible = stats.filter((a) => a.byYear.length > 1);
  const risers = [...eligible].sort((a, b) => b.trend - a.trend).slice(0, 5);
  const fallers = [...eligible].sort((a, b) => a.trend - b.trend).slice(0, 5);
  const stable = [...eligible.filter((a) => a.overallPctDays > 5)]
    .sort((a, b) => Math.abs(a.trend) - Math.abs(b.trend))
    .slice(0, 5);

  const tabs: { id: TabId; label: string; items: ActivityYearStat[]; color: string }[] = [
    { id: "rising", label: "Rising", items: risers, color: "var(--color-accent)" },
    { id: "falling", label: "Falling", items: fallers, color: "var(--color-negative)" },
    { id: "consistent", label: "Most consistent", items: stable, color: "var(--color-text-secondary)" },
  ];
  const active = tabs.find((t) => t.id === tab)!;

  return (
    <Card
      title="Activity changes"
      subtitle="Biggest movers by % of tracked days, first year vs. last year"
    >
      <div role="tablist" aria-label="Activity change category" className="mb-4 flex gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === tab}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              t.id === tab
                ? "bg-(--color-accent) text-black"
                : "bg-(--color-surface-2) text-(--color-text-secondary) active:bg-(--color-border)"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ActivityList items={active.items} color={active.color} />
    </Card>
  );
}
