import {
  type DocumentData,
  type QueryDocumentSnapshot,
  type FirestoreDataConverter,
  Timestamp,
} from "firebase/firestore";

/**
 * A habit the user is building (or a "quit"/negative habit they're avoiding).
 * Stored at `users/{uid}/habits/{habitId}` in Firestore. The document shape is
 * **wire-identical to the native apps** (pathivu-android `Habit.kt`,
 * pathivu-ios `Habit.swift`) so the same account syncs across web/Android/iOS.
 *
 * Notes:
 * - `emoji` holds an *icon key* (see constants.ts), not an emoji — the field
 *   name is kept for backwards-compatibility with existing documents.
 * - `completedDates` is a list of ISO `yyyy-MM-dd` strings. Toggling a day is an
 *   atomic arrayUnion/arrayRemove, so it's race-free across devices.
 */
export interface Habit {
  id?: string;
  name: string;
  emoji: string;
  colorIndex: number;
  category: string;
  scheduleType: ScheduleType;
  daysOfWeek: number[];
  weeklyTarget: number;
  monthlyTarget: number;
  negative: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  completedDates: string[];
  createdAt: Date | null;
  sortOrder: number;
  archived: boolean;
}

export type ScheduleType =
  | "daily"
  | "weekly"
  | "weekly_count"
  | "monthly_count";

export const SCHEDULE_DAILY = "daily";
export const SCHEDULE_WEEKLY = "weekly";
export const SCHEDULE_WEEKLY_COUNT = "weekly_count";
export const SCHEDULE_MONTHLY_COUNT = "monthly_count";

/** Defaults match the native models exactly. */
export function defaultHabit(): Habit {
  return {
    name: "",
    emoji: "target",
    colorIndex: 0,
    category: "Health",
    scheduleType: SCHEDULE_DAILY,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    weeklyTarget: 5,
    monthlyTarget: 10,
    negative: false,
    reminderEnabled: false,
    reminderHour: 9,
    reminderMinute: 0,
    completedDates: [],
    createdAt: null,
    sortOrder: 0,
    archived: false,
  };
}

/**
 * Firestore <-> Habit converter. Reads tolerate missing/legacy fields (falling
 * back to native defaults); writes omit `id` and never clobber `createdAt`
 * (that is set server-side via serverTimestamp() on create).
 */
export const habitConverter: FirestoreDataConverter<Habit> = {
  toFirestore(habit: Habit): DocumentData {
    const { id: _id, createdAt: _createdAt, ...rest } = habit;
    void _id;
    void _createdAt;
    return rest;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Habit {
    const d = snapshot.data();
    const base = defaultHabit();
    const created = d.createdAt;
    return {
      id: snapshot.id,
      name: d.name ?? base.name,
      emoji: d.emoji ?? base.emoji,
      colorIndex: d.colorIndex ?? base.colorIndex,
      category: d.category ?? base.category,
      scheduleType: (d.scheduleType ?? base.scheduleType) as ScheduleType,
      daysOfWeek: Array.isArray(d.daysOfWeek) ? d.daysOfWeek : base.daysOfWeek,
      weeklyTarget: d.weeklyTarget ?? base.weeklyTarget,
      monthlyTarget: d.monthlyTarget ?? base.monthlyTarget,
      negative: d.negative ?? base.negative,
      reminderEnabled: d.reminderEnabled ?? base.reminderEnabled,
      reminderHour: d.reminderHour ?? base.reminderHour,
      reminderMinute: d.reminderMinute ?? base.reminderMinute,
      completedDates: Array.isArray(d.completedDates) ? d.completedDates : [],
      createdAt: created instanceof Timestamp ? created.toDate() : null,
      sortOrder: d.sortOrder ?? base.sortOrder,
      archived: d.archived ?? base.archived,
    };
  },
};
