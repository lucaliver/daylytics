import { useMemo, useState, type ReactNode } from "react";
import type { DashboardData, Entry } from "../types";
import { applyMoodOrder } from "../parser/moodInference";
import { getHistoryHeader } from "../analytics/historyHeader";
import { getMonthlyMood, getYearlyReferences } from "../analytics/monthlyMood";
import { getYearOverYear } from "../analytics/yearOverYear";
import { getActivityStats } from "../analytics/activityStats";
import { getMoodDistribution } from "../analytics/moodDistribution";
import { getStandoutDays } from "../analytics/standoutDays";
import { getAchievements } from "../analytics/achievements";
import { getNotesAnalysis } from "../analytics/notes";
import { buildNoteSearchIndex } from "../analytics/noteSearch";
import { getYearInReview } from "../analytics/yearInReview";
import { getInsights } from "../analytics/insights";
import { DataContext, type DataContextValue } from "./context";

export function DataProvider({ children }: { children: ReactNode }) {
  const [rawEntries, setRawEntries] = useState<Entry[] | null>(null);
  const [moodOrder, setMoodOrder] = useState<string[] | null>(null);

  const distinctMoods = useMemo(
    () => (rawEntries ? Array.from(new Set(rawEntries.map((e) => e.mood))) : []),
    [rawEntries],
  );

  // The expensive step: every analytics function here is a pure function
  // over the scored entries, so this only re-runs when entries/order change.
  const dashboardData = useMemo<DashboardData | null>(() => {
    if (!rawEntries || !moodOrder) return null;
    const scored = applyMoodOrder(rawEntries, moodOrder);
    if (scored.length === 0) return null;

    const yearOverYear = getYearOverYear(scored);
    const activityStats = getActivityStats(scored);
    const historyHeader = getHistoryHeader(scored);
    const monthlyMood = getMonthlyMood(scored);

    return {
      moodOrder,
      historyHeader,
      monthlyMood,
      yearlyReferences: getYearlyReferences(scored),
      yearOverYear,
      activityStats,
      moodDistribution: getMoodDistribution(scored, moodOrder),
      standoutDays: getStandoutDays(scored, monthlyMood),
      achievements: getAchievements(scored, moodOrder),
      notesAnalysis: getNotesAnalysis(scored, moodOrder),
      noteSearch: buildNoteSearchIndex(scored, moodOrder),
      yearInReview: getYearInReview(scored, moodOrder),
      insights: getInsights(yearOverYear, activityStats, moodOrder, historyHeader.startDate),
    };
  }, [rawEntries, moodOrder]);

  const value: DataContextValue = {
    rawEntries,
    distinctMoods,
    moodOrder,
    dashboardData,
    loadEntries: (entries) => {
      setRawEntries(entries);
      setMoodOrder(null);
    },
    confirmMoodOrder: (order) => setMoodOrder(order),
    reset: () => {
      setRawEntries(null);
      setMoodOrder(null);
    },
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
