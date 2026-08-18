import { useEffect, useState } from "react";
import { useData } from "../data/useData";
import { HistoryHeader } from "../components/HistoryHeader";
import { MoodTimeline } from "../components/MoodTimeline";
import { YearOverYear } from "../components/YearOverYear";
import { ActivityChanges } from "../components/ActivityChanges";
import { ActivityHeatmap } from "../components/ActivityHeatmap";
import { MoodDistribution } from "../components/MoodDistribution";
import { StandoutDays } from "../components/StandoutDays";
import { NotesAnalysis } from "../components/NotesAnalysis";
import { Achievements } from "../components/Achievements";
import { KeyInsights } from "../components/KeyInsights";
import { Reveal } from "../components/Reveal";
import { SectionsMenu } from "../components/SectionsMenu";
import { UploadIcon } from "../components/icons";

const HIDDEN_SECTIONS_KEY = "daylytics:hiddenSections";

function loadHiddenSections(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_SECTIONS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function Dashboard() {
  const { dashboardData, reset } = useData();
  const [hidden, setHidden] = useState<Set<string>>(loadHiddenSections);

  useEffect(() => {
    localStorage.setItem(HIDDEN_SECTIONS_KEY, JSON.stringify(Array.from(hidden)));
  }, [hidden]);

  if (!dashboardData) return null;

  function toggleSection(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sections = [
    { id: "history", label: "History", node: <HistoryHeader data={dashboardData.historyHeader} /> },
    { id: "insights", label: "Key insights", node: <KeyInsights insights={dashboardData.insights} /> },
    {
      id: "timeline",
      label: "Mood over time",
      node: (
        <MoodTimeline
          monthlyMood={dashboardData.monthlyMood}
          yearlyReferences={dashboardData.yearlyReferences}
          moodOrder={dashboardData.moodOrder}
        />
      ),
    },
    {
      id: "yearOverYear",
      label: "Year over year",
      node: <YearOverYear rows={dashboardData.yearOverYear} moodOrder={dashboardData.moodOrder} />,
    },
    {
      id: "distribution",
      label: "Mood composition",
      node: (
        <MoodDistribution rows={dashboardData.moodDistribution} moodOrder={dashboardData.moodOrder} />
      ),
    },
    {
      id: "standoutDays",
      label: "Best days",
      node: (
        <StandoutDays standoutDays={dashboardData.standoutDays} moodOrder={dashboardData.moodOrder} />
      ),
    },
    {
      id: "notes",
      label: "Notes",
      node: <NotesAnalysis scopes={dashboardData.notesAnalysis} moodOrder={dashboardData.moodOrder} />,
    },
    {
      id: "achievements",
      label: "Special achievements",
      node: <Achievements achievements={dashboardData.achievements} />,
    },
    {
      id: "activityChanges",
      label: "Activity changes",
      node: <ActivityChanges stats={dashboardData.activityStats} />,
    },
    {
      id: "activityHeatmap",
      label: "Activity heatmap",
      node: <ActivityHeatmap stats={dashboardData.activityStats} />,
    },
  ];

  const visibleSections = sections.filter((s) => !hidden.has(s.id));

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-(--color-border) bg-(--color-bg)/90 px-4 py-3.5 backdrop-blur sm:px-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.875rem)" }}
      >
        <h1 className="text-2xl font-extrabold tracking-tight">
          <span className="text-(--color-text-primary)">Day</span>
          <span className="text-(--color-accent)">lytics</span>
        </h1>
        <div className="flex items-center gap-2.5">
          <SectionsMenu
            sections={sections.map(({ id, label }) => ({ id, label }))}
            hidden={hidden}
            onToggle={toggleSection}
          />
          <button
            onClick={reset}
            aria-label="New upload"
            className="flex items-center gap-1.5 rounded-full border border-(--color-border) px-3.5 py-2 text-sm text-(--color-text-secondary) transition-colors active:bg-(--color-surface-2)"
          >
            <UploadIcon size={16} />
            <span className="hidden sm:inline">New upload</span>
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-4 pt-4 sm:space-y-5 sm:px-6 sm:pt-6">
        {visibleSections.length === 0 ? (
          <p className="py-16 text-center text-sm text-(--color-text-secondary)">
            All sections are hidden. Use "Sections" above to bring some back.
          </p>
        ) : (
          visibleSections.map((section, i) => (
            <Reveal key={section.id} index={i}>
              {section.node}
            </Reveal>
          ))
        )}
      </div>

      <footer className="mx-auto w-full max-w-6xl px-4 pt-8 text-center text-sm text-(--color-text-tertiary) sm:px-6">
        No data collected. Everything above runs locally in your browser.
      </footer>
    </div>
  );
}
