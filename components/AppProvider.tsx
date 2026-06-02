"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type User } from "firebase/auth";
import { watchAuth, completeRedirectSignIn } from "@/lib/auth";
import { watchHabits, setDayDone, persistOrder } from "@/lib/firestore";
import { type Habit } from "@/lib/habit";
import { computeHero, type HeroState } from "@/lib/heroState";
import * as Stats from "@/lib/habitStats";
import { hydratePreferences } from "@/lib/preferences";

interface AppState {
  user: User | null;
  authReady: boolean;
  habitsLoading: boolean;
  habits: Habit[];
  hero: HeroState;
  toggleToday: (habit: Habit) => void;
  toggleDay: (habit: Habit, date: Date) => void;
  reorder: (orderedIds: string[]) => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);

  // Apply persisted prefs to the stats engine before anything renders data.
  useEffect(() => {
    hydratePreferences();
  }, []);

  useEffect(() => {
    completeRedirectSignIn();
    const unsub = watchAuth((u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setHabitsLoading(false);
      return;
    }
    setHabitsLoading(true);
    const unsub = watchHabits(
      user.uid,
      (h) => {
        setHabits(h);
        setHabitsLoading(false);
      },
      () => setHabitsLoading(false),
    );
    return unsub;
  }, [user]);

  const toggleDay = useCallback(
    (habit: Habit, date: Date) => {
      if (!user || !habit.id) return;
      const ds = Stats.key(date);
      const done = habit.completedDates.includes(ds);
      // Optimistic update; Firestore offline cache + onSnapshot reconcile.
      void setDayDone(user.uid, habit.id, ds, !done);
    },
    [user],
  );

  const toggleToday = useCallback(
    (habit: Habit) => toggleDay(habit, Stats.today()),
    [toggleDay],
  );

  const reorder = useCallback(
    (orderedIds: string[]) => {
      if (!user) return;
      void persistOrder(user.uid, orderedIds);
    },
    [user],
  );

  const hero = useMemo(() => computeHero(habits), [habits]);

  const value: AppState = useMemo(
    () => ({
      user,
      authReady,
      habitsLoading,
      habits,
      hero,
      toggleToday,
      toggleDay,
      reorder,
    }),
    [user, authReady, habitsLoading, habits, hero, toggleToday, toggleDay, reorder],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
