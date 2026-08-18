import { useState, type ComponentType } from "react";
import type { Achievement } from "../types";
import { Card } from "./Card";
import {
  BadgeIcon,
  BookIcon,
  ChevronDownIcon,
  FlagIcon,
  FlameIcon,
  GhostIcon,
  LoopIcon,
  MoonIcon,
  MusicNoteIcon,
  SunriseIcon,
  TrophyIcon,
  ZigzagIcon,
} from "./icons";

const COLLAPSED_COUNT = 3;

const ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  "origin-story": FlagIcon,
  "night-owl": MoonIcon,
  "early-bird": SunriseIcon,
  "the-regular": FlameIcon,
  "one-hit-wonders": MusicNoteIcon,
  "great-disappearance": GhostIcon,
  "groundhog-day": LoopIcon,
  "war-and-peace": BookIcon,
  "mood-rollercoaster": ZigzagIcon,
  completionist: TrophyIcon,
};

const DATE_RE = /\b[A-Z][a-z]+\s\d{1,2},\s\d{4}\b/;
const TOKEN_RE = new RegExp(`("[^"]+"|${DATE_RE.source}|\\b\\d+\\b)`, "g");
const BOLD_RE = new RegExp(`^(${DATE_RE.source}|\\d+)$`);

/** Quoted activity/mood names, dates, and bare numbers are bolded so the
 * concrete "what happened" stands out from the surrounding sentence. */
function renderDescription(text: string) {
  const parts = text.split(TOKEN_RE);
  return parts.map((part, i) =>
    part.startsWith('"') || BOLD_RE.test(part) ? (
      <strong key={i} className="font-semibold text-(--color-text-primary)">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function Achievements({ achievements }: { achievements: Achievement[] }) {
  const [expanded, setExpanded] = useState(false);

  if (achievements.length === 0) return null;

  const hasMore = achievements.length > COLLAPSED_COUNT;
  const visible = expanded ? achievements : achievements.slice(0, COLLAPSED_COUNT);

  return (
    <Card
      title="Special achievements"
      subtitle="Strange patterns in your data"
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map((a) => {
          const Icon = ICONS[a.id] ?? BadgeIcon;
          return (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface-2) p-4"
            >
              <Icon size={28} className="shrink-0 text-(--color-accent)" />
              <div className="min-w-0">
                <p className="font-semibold tracking-tight">{a.title}</p>
                <p className="mt-0.5 text-sm text-(--color-text-secondary)">
                  {renderDescription(a.description)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium text-(--color-text-secondary) transition-colors active:bg-(--color-surface-2)"
        >
          {expanded ? "Show less" : `Show ${achievements.length - COLLAPSED_COUNT} more`}
          <ChevronDownIcon
            size={14}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </Card>
  );
}
