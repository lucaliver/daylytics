import type { HistoryHeaderData } from "../types";
import { formatDate } from "../lib/format";

export function HistoryHeader({ data }: { data: HistoryHeaderData }) {
  const stats = [
    { label: "Tracking since", value: formatDate(data.startDate) },
    { label: "Latest entry", value: formatDate(data.endDate) },
    { label: "Days tracked", value: `${data.daysTracked} / ${data.totalDaySpan}` },
    { label: "Entries / week", value: data.entriesPerWeek.toFixed(1) },
  ];

  return (
    <section className="flex flex-wrap gap-x-6 gap-y-3 rounded-3xl border border-(--color-border) bg-(--color-surface) px-5 py-4 sm:px-6">
      {stats.map((s) => (
        <div key={s.label} className="min-w-[7rem] flex-1">
          <p className="text-sm text-(--color-text-secondary)">{s.label}</p>
          <p className="mt-0.5 text-base font-bold tracking-tight">{s.value}</p>
        </div>
      ))}
    </section>
  );
}
