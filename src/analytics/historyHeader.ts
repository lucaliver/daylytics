import type { HistoryHeaderData, ScoredEntry } from "../types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getHistoryHeader(entries: ScoredEntry[]): HistoryHeaderData {
  const startDate = entries[0].date;
  const endDate = entries[entries.length - 1].date;
  const totalDaySpan =
    Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
  const daysTracked = new Set(entries.map((e) => e.fullDate)).size;
  const weeks = totalDaySpan / 7;
  const entriesPerWeek = weeks > 0 ? entries.length / weeks : 0;

  return { startDate, endDate, totalDaySpan, daysTracked, entriesPerWeek };
}
