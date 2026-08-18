import type { Achievement, ScoredEntry } from "../types";
import { formatDate } from "../lib/format";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseHour(time: string): number | null {
  const m = /^(\d{1,2}):/.exec(time);
  return m ? Number(m[1]) : null;
}

function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db.getTime() - da.getTime()) / MS_PER_DAY);
}

function activitySetKey(activities: string[]): string {
  return [...activities].sort().join("|");
}

function findNightOwl(entries: ScoredEntry[]): Achievement | null {
  const count = entries.filter((e) => {
    const h = parseHour(e.time);
    return h !== null && h >= 0 && h < 4;
  }).length;
  if (count === 0) return null;
  return {
    id: "night-owl",
    title: "Night Owl",
    description: `${count} ${count === 1 ? "entry" : "entries"} logged between midnight and 4 AM, when the sane world was asleep.`,
  };
}

function findEarlyBird(entries: ScoredEntry[]): Achievement | null {
  const count = entries.filter((e) => {
    const h = parseHour(e.time);
    return h !== null && h >= 5 && h < 7;
  }).length;
  if (count === 0) return null;
  return {
    id: "early-bird",
    title: "Early Bird",
    description: `${count} ${count === 1 ? "entry" : "entries"} logged before 7 AM. Rise and shine.`,
  };
}

function findTheRegular(entries: ScoredEntry[]): Achievement | null {
  const byActivity = new Map<string, Set<string>>();
  for (const e of entries) {
    for (const a of e.activities) {
      if (!byActivity.has(a)) byActivity.set(a, new Set());
      byActivity.get(a)!.add(e.fullDate);
    }
  }

  let best: { activity: string; streak: number } | null = null;
  for (const [activity, daySet] of byActivity) {
    const days = Array.from(daySet).sort();
    let streak = 1;
    let maxStreak = 1;
    for (let i = 1; i < days.length; i++) {
      streak = dayDiff(days[i - 1], days[i]) === 1 ? streak + 1 : 1;
      maxStreak = Math.max(maxStreak, streak);
    }
    if (!best || maxStreak > best.streak) best = { activity, streak: maxStreak };
  }

  if (!best || best.streak < 4) return null;
  return {
    id: "the-regular",
    title: "The Regular",
    description: `"${best.activity}" showed up ${best.streak} days in a row at one point. That's not a phase, that's a lifestyle.`,
  };
}

function findOneHitWonders(entries: ScoredEntry[]): Achievement | null {
  const daysByActivity = new Map<string, Set<string>>();
  for (const e of entries) {
    for (const a of e.activities) {
      if (!daysByActivity.has(a)) daysByActivity.set(a, new Set());
      daysByActivity.get(a)!.add(e.fullDate);
    }
  }
  const oneHit = Array.from(daysByActivity.entries()).filter(([, days]) => days.size === 1);
  if (oneHit.length === 0) return null;
  return {
    id: "one-hit-wonders",
    title: "One-Hit Wonders",
    description: `${oneHit.length} activities you logged exactly once and never mentioned again, including "${oneHit[0][0]}."`,
  };
}

function findGreatDisappearance(entries: ScoredEntry[]): Achievement | null {
  const days = Array.from(new Set(entries.map((e) => e.fullDate))).sort();
  let maxGap = 0;
  let start = "";
  let end = "";
  for (let i = 1; i < days.length; i++) {
    const gap = dayDiff(days[i - 1], days[i]);
    if (gap > maxGap) {
      maxGap = gap;
      start = days[i - 1];
      end = days[i];
    }
  }
  if (maxGap < 7) return null;
  return {
    id: "great-disappearance",
    title: "The Great Disappearance",
    description: `Your longest break from logging lasted ${maxGap} days, between ${formatDate(new Date(`${start}T00:00:00`))} and ${formatDate(new Date(`${end}T00:00:00`))}.`,
  };
}

function findGroundhogDay(entries: ScoredEntry[]): Achievement | null {
  const byCombo = new Map<string, { activities: string[]; days: Set<string> }>();
  for (const e of entries) {
    if (e.activities.length < 2) continue;
    const key = activitySetKey(e.activities);
    if (!byCombo.has(key)) byCombo.set(key, { activities: e.activities, days: new Set() });
    byCombo.get(key)!.days.add(e.fullDate);
  }

  let best: { activities: string[]; days: number } | null = null;
  for (const { activities, days } of byCombo.values()) {
    if (!best || days.size > best.days) best = { activities, days: days.size };
  }

  if (!best || best.days < 3) return null;
  return {
    id: "groundhog-day",
    title: "Groundhog Day",
    description: `You logged this exact same set of activities on ${best.days} different days: "${best.activities.join(", ")}."`,
  };
}

function findWarAndPeace(entries: ScoredEntry[]): Achievement | null {
  const wordiest = [...entries].sort((a, b) => b.noteWords.length - a.noteWords.length)[0];
  if (!wordiest || wordiest.noteWords.length < 50) return null;
  return {
    id: "war-and-peace",
    title: "War and Peace",
    description: `Your longest note ran ${wordiest.noteWords.length} words, on ${formatDate(wordiest.date)}.`,
  };
}

function findMoodRollercoaster(entries: ScoredEntry[], moodOrder: string[]): Achievement | null {
  let biggest: { swing: number; a: ScoredEntry; b: ScoredEntry } | null = null;
  for (let i = 1; i < entries.length; i++) {
    const swing = Math.abs(entries[i].moodValue - entries[i - 1].moodValue);
    if (!biggest || swing > biggest.swing) biggest = { swing, a: entries[i - 1], b: entries[i] };
  }
  const threshold = Math.max(2, moodOrder.length - 2);
  if (!biggest || biggest.swing < threshold) return null;
  return {
    id: "mood-rollercoaster",
    title: "Mood Rollercoaster",
    description: `Biggest back-to-back swing: "${biggest.a.mood}" on ${formatDate(biggest.a.date)}, then "${biggest.b.mood}" on ${formatDate(biggest.b.date)}.`,
  };
}

/** Light, deliberately silly achievement badges mined from patterns in the
 * data — a fun break from the analytical tone of everything else. Each one
 * only appears when it found something genuinely worth pointing out, so the
 * card's length reflects how much odd behavior actually turned up. */
export function getAchievements(entries: ScoredEntry[], moodOrder: string[]): Achievement[] {
  if (entries.length === 0) return [];

  const first = entries[0];
  const originStory: Achievement = {
    id: "origin-story",
    title: "The Origin Story",
    description: `Your very first entry was on ${formatDate(first.date)}, feeling "${first.mood}."`,
  };

  const totalActivities = new Set(entries.flatMap((e) => e.activities)).size;
  const completionist: Achievement = {
    id: "completionist",
    title: "The Completionist",
    description: `${totalActivities} different activities logged across your whole history.`,
  };

  const conditional = [
    findNightOwl(entries),
    findEarlyBird(entries),
    findTheRegular(entries),
    findOneHitWonders(entries),
    findGreatDisappearance(entries),
    findGroundhogDay(entries),
    findWarAndPeace(entries),
    findMoodRollercoaster(entries, moodOrder),
  ].filter((a): a is Achievement => a !== null);

  return [originStory, ...conditional.slice(0, 6), completionist];
}
