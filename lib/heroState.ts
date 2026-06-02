import { type Habit } from "./habit";
import * as Stats from "./habitStats";

/**
 * Aggregate state driving the "today" hero card. Mirrors the native
 * `HeroState` + `HeroSection` (title/subtitle/center-text rules), computed from
 * the active (non-archived) habit list.
 */
export interface HeroState {
  totalActive: number;
  dueToday: number;
  doneToday: number;
  slipsToday: number;
  bestStreak: number;
  dayStreak: number;
}

export function computeHero(habits: Habit[]): HeroState {
  const active = habits.filter((h) => !h.archived);
  const positives = active.filter((h) => !h.negative);
  const negatives = active.filter((h) => h.negative);

  const dueToday = positives.filter((h) => Stats.isDueToday(h)).length;
  const doneToday = positives.filter(
    (h) => Stats.isDueToday(h) && Stats.isDoneToday(h),
  ).length;
  const slipsToday = negatives.filter((h) => Stats.isDoneToday(h)).length;
  const bestStreak = active.reduce((m, h) => Math.max(m, Stats.currentStreak(h)), 0);

  return {
    totalActive: active.length,
    dueToday,
    doneToday,
    slipsToday,
    bestStreak,
    dayStreak: Stats.dayStreak(active),
  };
}

export function allDone(h: HeroState): boolean {
  return h.dueToday > 0 && h.doneToday >= h.dueToday;
}

export function progress(h: HeroState): number {
  return h.dueToday === 0 ? 0 : h.doneToday / h.dueToday;
}

/** Net daily score: positive completions minus negative slips. */
export function score(h: HeroState): number {
  return h.doneToday - h.slipsToday;
}

export function heroLabel(h: HeroState): string {
  return h.totalActive === 0 ? "LET'S GO" : "TODAY";
}

export function heroTitle(h: HeroState): string {
  if (h.totalActive === 0) return "Start your first habit";
  if (h.dueToday === 0) return "No habits today";
  if (allDone(h)) return "All done";
  const left = h.dueToday - h.doneToday;
  return `${left} ${left === 1 ? "habit" : "habits"} to go`;
}

export function heroCenter(h: HeroState): string {
  if (h.totalActive === 0) return "0";
  return h.dueToday === 0 ? "—" : `${h.doneToday}/${h.dueToday}`;
}

export function heroSubtitle(h: HeroState): { text: string; isSlip: boolean } {
  if (h.totalActive === 0) return { text: "Tap + to begin", isSlip: false };
  if (h.slipsToday > 0) {
    const s = h.slipsToday === 1 ? "slip" : "slips";
    return { text: `−${h.slipsToday} ${s} today`, isSlip: true };
  }
  if (h.dayStreak > 0) return { text: `${h.dayStreak}-day streak`, isSlip: false };
  if (h.dueToday === 0) return { text: "Enjoy your rest day", isSlip: false };
  if (allDone(h)) return { text: "Great work today", isSlip: false };
  return { text: "Keep it going", isSlip: false };
}
