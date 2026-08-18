import { createContext } from "react";
import type { DashboardData, Entry } from "../types";

export interface DataContextValue {
  rawEntries: Entry[] | null;
  distinctMoods: string[];
  moodOrder: string[] | null;
  dashboardData: DashboardData | null;
  loadEntries: (entries: Entry[]) => void;
  confirmMoodOrder: (order: string[]) => void;
  reset: () => void;
}

export const DataContext = createContext<DataContextValue | null>(null);
