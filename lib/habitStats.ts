import {
  type Habit,
  SCHEDULE_WEEKLY,
  SCHEDULE_WEEKLY_COUNT,
  SCHEDULE_MONTHLY_COUNT,
} from "./habit";
import { DAY_LABELS_FULL } from "./constants";

/**
 * Pure, side-effect-free habit analytics — a 1:1 port of the native
 * `HabitStats.swift` / `HabitStats.kt`. Everything the UI shows about progress
 * (streaks, week-dots, completion rate, the heatmap) is computed here so there
 * is a single source of truth and the Firestore document stays a plain data bag.
 *
 * Dates are ISO `yyyy-MM-dd` in the device's *local* timezone; weekday numbers
 * follow ISO-8601 (1 = Mon … 7 = Sun). All day math goes through local-midnight
 * Date construction, which is DST-safe (matching Swift's `Calendar`).
 */

export type DayStatus = "done" | "missed" | "todayPending" | "notScheduled" | "future";

// Module-level config, mirroring the native static vars. Set from prefs at
// startup and whenever changed in Settings.
export const config = {
  /** Hour a new day begins (0 = midnight). Lets a night-owl log after midnight. */
  dayStartHour: 0,
  /** First day of the week (ISO: 1 = Mon … 7 = Sun). */
  weekStartDay: 1,
};

// MARK: - Calendar plumbing -------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO `yyyy-MM-dd` key for a date (local time). */
export function key(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parse(k: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Add months, clamping the day to the target month's length (like Swift). */
function addMonths(date: Date, months: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth() + months;
  const targetYear = y + Math.floor(m / 12);
  const targetMonth = ((m % 12) + 12) % 12;
  const day = Math.min(date.getDate(), daysInMonth(targetYear, targetMonth));
  return new Date(targetYear, targetMonth, day);
}

/** ISO weekday for a date: 1 = Mon … 7 = Sun. */
export function isoWeekday(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1; // JS getDay(): 0 = Sun … 6 = Sat
}

/** First day of `date`'s week, honouring the configurable `weekStartDay`. */
function weekStart(date: Date): Date {
  const wd = isoWeekday(date);
  const ws = Math.min(Math.max(config.weekStartDay, 1), 7);
  const back = ((wd - ws) + 7) % 7;
  return startOfDay(addDays(date, -back));
}

// MARK: - Today -------------------------------------------------------------

/** "Today", honouring `dayStartHour` — before that hour it's still yesterday. */
export function today(): Date {
  const shifted = new Date(Date.now() - config.dayStartHour * 3600_000);
  return startOfDay(shifted);
}

export function todayStr(): string {
  return key(today());
}

export function isDone(habit: Habit, date: Date): boolean {
  return habit.completedDates.includes(key(date));
}

export function isDoneToday(habit: Habit): boolean {
  return isDone(habit, today());
}

/** Whether the habit is meant to be performed on `date`. */
export function isScheduledOn(habit: Habit, date: Date): boolean {
  if (habit.scheduleType === SCHEDULE_WEEKLY) {
    return habit.daysOfWeek.includes(isoWeekday(date));
  }
  // Daily and "x per week/month" habits are eligible any day.
  return true;
}

export function isDueToday(habit: Habit): boolean {
  return isScheduledOn(habit, today());
}

// MARK: - Streaks -----------------------------------------------------------

/** Current streak, interpreted per schedule so the flame always means the right thing. */
export function currentStreak(habit: Habit): number {
  if (habit.negative) return cleanStreak(habit);
  switch (habit.scheduleType) {
    case SCHEDULE_WEEKLY_COUNT:
      return weeklyStreak(habit);
    case SCHEDULE_MONTHLY_COUNT:
      return monthlyStreak(habit);
    default:
      return dailyStreak(habit);
  }
}

/**
 * Consecutive *scheduled* days completed, ending today (or the most recent
 * scheduled day). If today is scheduled but not yet done, the streak is not
 * broken — it counts up to yesterday.
 */
function dailyStreak(habit: Habit): number {
  if (habit.completedDates.length === 0) return 0;
  const done = new Set(habit.completedDates);
  let cursor = today();
  if (isScheduledOn(habit, cursor) && !done.has(key(cursor))) {
    cursor = addDays(cursor, -1);
  }
  let streak = 0;
  let guard = 0;
  while (guard < 3660) {
    guard += 1;
    if (isScheduledOn(habit, cursor)) {
      if (done.has(key(cursor))) streak += 1;
      else break;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function completionsInRange(done: Set<string>, start: Date, endInclusive: Date): number {
  let count = 0;
  let d = start;
  while (d <= endInclusive) {
    if (done.has(key(d))) count += 1;
    d = addDays(d, 1);
  }
  return count;
}

function monthBounds(date: Date): { first: Date; last: Date } {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const count = daysInMonth(date.getFullYear(), date.getMonth());
  return { first: startOfDay(first), last: startOfDay(addDays(first, count - 1)) };
}

function completionsInMonth(done: Set<string>, monthAnchor: Date): number {
  const { first, last } = monthBounds(monthAnchor);
  return completionsInRange(done, first, last);
}

/** Consecutive ISO weeks (ending this week) that met the weekly target. */
function weeklyStreak(habit: Habit): number {
  const target = Math.max(habit.weeklyTarget, 1);
  const done = new Set(habit.completedDates);
  const thisWeekStart = weekStart(today());
  let streak = 0;
  if (completionsInRange(done, thisWeekStart, addDays(thisWeekStart, 6)) >= target) streak += 1;
  let wkStart = addWeeks(thisWeekStart, -1);
  let guard = 0;
  while (guard < 520) {
    guard += 1;
    if (completionsInRange(done, wkStart, addDays(wkStart, 6)) >= target) streak += 1;
    else break;
    wkStart = addWeeks(wkStart, -1);
  }
  return streak;
}

/** Consecutive calendar months (ending this month) that met the monthly target. */
function monthlyStreak(habit: Habit): number {
  const target = Math.max(habit.monthlyTarget, 1);
  const done = new Set(habit.completedDates);
  const thisMonth = today();
  let streak = 0;
  if (completionsInMonth(done, thisMonth) >= target) streak += 1;
  let m = addMonths(thisMonth, -1);
  let guard = 0;
  while (guard < 1200) {
    guard += 1;
    if (completionsInMonth(done, m) >= target) streak += 1;
    else break;
    m = addMonths(m, -1);
  }
  return streak;
}

/**
 * Negative habits: consecutive *clean* days (no slip), counting today, since the
 * later of the last slip or the habit's creation. A slip today → 0.
 */
function cleanStreak(habit: Habit): number {
  const todayD = today();
  const slips = habit.completedDates
    .map(parse)
    .filter((d): d is Date => d !== null)
    .map(startOfDay)
    .filter((d) => d <= todayD);
  const lastSlip = slips.length ? new Date(Math.max(...slips.map((d) => d.getTime()))) : null;
  if (lastSlip && lastSlip.getTime() === todayD.getTime()) return 0;
  const created = habit.createdAt ? startOfDay(habit.createdAt) : null;
  let startCounting: Date;
  if (lastSlip) {
    const dayAfter = addDays(lastSlip, 1);
    startCounting = created && created > dayAfter ? created : dayAfter;
  } else if (created) {
    startCounting = created;
  } else {
    return 0; // no anchor yet — avoid a bogus huge count
  }
  if (startCounting > todayD) return 0;
  const days = Math.round((todayD.getTime() - startCounting.getTime()) / 86_400_000);
  return Math.max(days + 1, 0);
}

/** Done / target for the current week (for `weekly_count` cards). */
export function weekProgress(habit: Habit): { done: number; target: number } {
  const start = weekStart(today());
  return {
    done: completionsInRange(new Set(habit.completedDates), start, addDays(start, 6)),
    target: Math.max(habit.weeklyTarget, 1),
  };
}

/** Done / target for the current month (for `monthly_count` cards). */
export function monthProgress(habit: Habit): { done: number; target: number } {
  return {
    done: completionsInMonth(new Set(habit.completedDates), today()),
    target: Math.max(habit.monthlyTarget, 1),
  };
}

/**
 * Global "perfect day" streak: consecutive days where every positively-scheduled
 * habit due that day was done AND no negative habit was slipped.
 */
export function dayStreak(habits: Habit[]): number {
  const active = habits.filter((h) => !h.archived);
  if (active.length === 0) return 0;
  const positives = active.filter((h) => !h.negative);
  const negatives = active.filter((h) => h.negative);

  const slippedOn = (d: Date) => negatives.some((h) => h.completedDates.includes(key(d)));
  const dueOn = (d: Date) =>
    positives.filter(
      (h) =>
        (h.scheduleType === "daily" || h.scheduleType === SCHEDULE_WEEKLY) &&
        isScheduledOn(h, d),
    );
  const qualifies = (d: Date) => {
    if (slippedOn(d)) return false;
    const due = dueOn(d);
    return due.length === 0 || due.every((h) => h.completedDates.includes(key(d)));
  };

  let cursor = today();
  if (!slippedOn(cursor)) {
    const due = dueOn(cursor);
    const allDone = due.length > 0 && due.every((h) => h.completedDates.includes(key(cursor)));
    if (!allDone) cursor = addDays(cursor, -1);
  }
  const createdTimes = active
    .map((h) => (h.createdAt ? startOfDay(h.createdAt).getTime() : null))
    .filter((t): t is number => t !== null);
  const earliest = createdTimes.length ? new Date(Math.min(...createdTimes)) : null;
  let streak = 0;
  let guard = 0;
  while (guard < 3660) {
    guard += 1;
    if (earliest && cursor < earliest) break;
    if (qualifies(cursor)) streak += 1;
    else break;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive calendar days ever completed. */
export function longestStreak(habit: Habit): number {
  if (habit.completedDates.length === 0) return 0;
  const dates = habit.completedDates
    .map(parse)
    .filter((d): d is Date => d !== null)
    .map(startOfDay)
    .sort((a, b) => a.getTime() - b.getTime());
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of dates) {
    if (prev && addDays(prev, 1).getTime() === d.getTime()) run += 1;
    else run = 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

export function totalCompletions(habit: Habit): number {
  return habit.completedDates.length;
}

/** Completion rate (0–100) over the last `days` scheduled days. */
export function completionRate(habit: Habit, days = 30): number {
  const done = new Set(habit.completedDates);
  let scheduled = 0;
  let completed = 0;
  let cursor = today();
  for (let i = 0; i < days; i++) {
    if (isScheduledOn(habit, cursor)) {
      scheduled += 1;
      if (done.has(key(cursor))) completed += 1;
    }
    cursor = addDays(cursor, -1);
  }
  return scheduled === 0 ? 0 : Math.round((completed * 100) / scheduled);
}

/** Completions in the week containing today. */
export function weekCompletions(habit: Habit): number {
  const start = weekStart(today());
  const done = new Set(habit.completedDates);
  let count = 0;
  for (let i = 0; i <= 6; i++) if (done.has(key(addDays(start, i)))) count += 1;
  return count;
}

/** First→last status cells for the current week, for the home row + chips. */
export function weekRow(habit: Habit): { date: Date; status: DayStatus }[] {
  const t = today();
  const start = weekStart(t);
  const done = new Set(habit.completedDates);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    let status: DayStatus;
    if (done.has(key(d))) status = "done";
    else if (d > t) status = "future";
    else if (!isScheduledOn(habit, d)) status = "notScheduled";
    else if (d.getTime() === t.getTime()) status = "todayPending";
    else status = "missed";
    return { date: d, status };
  });
}

export interface HeatCell {
  date: Date;
  isFuture: boolean;
  isDone: boolean;
  isScheduled: boolean;
}

/** Heatmap for one habit: `weeks` columns (oldest → newest) of 7 day-cells. */
export function heatmap(habit: Habit, weeks = 16): HeatCell[][] {
  const t = today();
  const thisWeekStart = weekStart(t);
  const firstWeekStart = addWeeks(thisWeekStart, -(weeks - 1));
  const done = new Set(habit.completedDates);
  return Array.from({ length: weeks }, (_, w) => {
    const colStart = addWeeks(firstWeekStart, w);
    return Array.from({ length: 7 }, (_, day) => {
      const d = addDays(colStart, day);
      return {
        date: d,
        isFuture: d > t,
        isDone: done.has(key(d)),
        isScheduled: isScheduledOn(habit, d),
      };
    });
  });
}

/**
 * Heatmap aggregated across multiple habits (intensity = fraction done). `-1`
 * marks a future day.
 */
export function heatmapAll(habits: Habit[], weeks = 16): number[][] {
  const t = today();
  const thisWeekStart = weekStart(t);
  const firstWeekStart = addWeeks(thisWeekStart, -(weeks - 1));
  return Array.from({ length: weeks }, (_, w) => {
    const colStart = addWeeks(firstWeekStart, w);
    return Array.from({ length: 7 }, (_, day) => {
      const d = addDays(colStart, day);
      if (d > t) return -1;
      const scheduled = habits.filter((h) => isScheduledOn(h, d));
      if (scheduled.length === 0) return 0;
      const doneCount = scheduled.filter((h) => h.completedDates.includes(key(d))).length;
      return doneCount / scheduled.length;
    });
  });
}

/** Human-readable schedule summary, e.g. "Daily", "Mon, Wed, Fri", "5× / week". */
export function scheduleLabel(habit: Habit): string {
  if (habit.negative) return "Avoid daily";
  switch (habit.scheduleType) {
    case SCHEDULE_WEEKLY:
      if (habit.daysOfWeek.length === 7) return "Daily";
      return [...habit.daysOfWeek]
        .sort((a, b) => a - b)
        .map((d) => DAY_LABELS_FULL[d - 1])
        .join(", ");
    case SCHEDULE_WEEKLY_COUNT:
      return `${habit.weeklyTarget}× / week`;
    case SCHEDULE_MONTHLY_COUNT:
      return `${habit.monthlyTarget}× / month`;
    default:
      return "Daily";
  }
}
