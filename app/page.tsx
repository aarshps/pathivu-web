"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, BarChart3, Plus, User as UserIcon } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { SignIn } from "@/components/SignIn";
import { HeroSection } from "@/components/HeroSection";
import { HabitList } from "@/components/HabitList";
import { AddHabitSheet } from "@/components/AddHabitSheet";
import { DayEditorSheet } from "@/components/DayEditorSheet";
import { type Habit } from "@/lib/habit";
import * as Stats from "@/lib/habitStats";
import { haptics } from "@/lib/haptics";

export default function Home() {
  const { user, authReady, habitsLoading, habits, hero, toggleToday, reorder } = useApp();
  const router = useRouter();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [dayEditorOpen, setDayEditorOpen] = useState(false);

  if (!authReady) return <Splash />;
  if (!user) return <SignIn />;

  const active = habits.filter((h) => !h.archived);

  function openAdd() {
    haptics.success();
    setEditing(null);
    setAddOpen(true);
  }
  function openEdit(h: Habit) {
    setEditing(h);
    setAddOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-lg min-h-dvh px-4 pb-28">
      {/* Top bar */}
      <header className="flex items-center gap-2 py-3 sticky top-0 z-20">
        <Link
          href="/settings"
          aria-label="Settings"
          className="grid place-items-center h-9 w-9 rounded-full overflow-hidden bg-surface-container text-on-surface-variant"
        >
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserIcon size={18} />
          )}
        </Link>
        <h1 className="flex-1 text-center text-lg font-extrabold tracking-tight">Pathivu</h1>
        <button
          onClick={() => {
            haptics.click();
            setDayEditorOpen(true);
          }}
          aria-label="Day editor"
          className="grid place-items-center h-9 w-9 rounded-full text-on-surface-variant hover:bg-surface-container transition"
        >
          <Calendar size={20} />
        </button>
        <Link
          href="/stats"
          aria-label="Stats"
          className="grid place-items-center h-9 w-9 rounded-full text-on-surface-variant hover:bg-surface-container transition"
        >
          <BarChart3 size={20} />
        </Link>
      </header>

      {habitsLoading ? (
        <Splash inline />
      ) : active.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <div className="flex flex-col gap-3">
          <HeroSection hero={hero} onClick={() => router.push("/stats")} />
          <HabitList habits={active} onToggle={toggleToday} onTap={openEdit} onReorder={reorder} />
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openAdd}
        aria-label="Add habit"
        className="fixed bottom-6 grid place-items-center rounded-full bg-primary text-on-primary shadow-lg active:scale-95 transition right-[max(1.5rem,calc(50vw-256px+1.5rem))]"
        style={{ height: 60, width: 60 }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <AddHabitSheet open={addOpen} habit={editing} onClose={() => setAddOpen(false)} />
      <DayEditorSheet open={dayEditorOpen} initialDate={Stats.today()} onClose={() => setDayEditorOpen(false)} />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-24 px-6">
      <div className="grid place-items-center h-20 w-20 rounded-[28px] bg-accent-soft text-accent text-4xl font-extrabold">
        പ
      </div>
      <div>
        <h2 className="text-xl font-bold">Start your first habit</h2>
        <p className="text-on-surface-variant mt-1">Tap below to add a habit and begin building your streak.</p>
      </div>
      <button onClick={onAdd} className="rounded-full bg-primary text-on-primary px-6 py-3 font-semibold active:scale-[0.98] transition">
        Add a habit
      </button>
    </div>
  );
}

function Splash({ inline }: { inline?: boolean }) {
  return (
    <div className={`grid place-items-center ${inline ? "py-24" : "min-h-dvh"}`}>
      <div className="h-8 w-8 rounded-full border-2 border-on-surface-variant/30 border-t-accent animate-spin" />
    </div>
  );
}
