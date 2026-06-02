"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Flame,
  TrendingUp,
  Layers,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Heatmap } from "@/components/Heatmap";
import * as Stats from "@/lib/habitStats";
import { iconFor } from "@/lib/constants";
import { type Habit, SCHEDULE_MONTHLY_COUNT, SCHEDULE_WEEKLY_COUNT } from "@/lib/habit";

export default function StatsPage() {
  const { habits } = useApp();
  const active = habits.filter((h) => !h.archived);
  const positives = active.filter((h) => !h.negative);

  const due = positives.filter((h) => Stats.isDueToday(h));
  const doneToday = due.filter((h) => Stats.isDoneToday(h)).length;

  return (
    <div className="mx-auto w-full max-w-lg min-h-dvh px-4 pb-16">
      <header className="flex items-center gap-2 py-3 sticky top-0 z-20">
        <Link href="/" aria-label="Back" className="grid place-items-center h-9 w-9 rounded-full text-on-surface-variant hover:bg-surface-container transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="flex-1 text-center text-lg font-extrabold tracking-tight">Stats</h1>
        <span className="w-9" />
      </header>

      <div className="flex flex-col gap-4">
        {/* Tiles */}
        <div className="grid grid-cols-2 gap-3">
          <Tile icon={<CheckCircle2 size={18} />} value={due.length === 0 ? "—" : `${doneToday}/${due.length}`} label="Done today" />
          <Tile icon={<Flame size={18} />} value={`${Stats.dayStreak(active)}`} label="Day streak" />
          <Tile icon={<TrendingUp size={18} />} value={`${overallRate(positives)}%`} label="30-day rate" />
          <Tile icon={<Layers size={18} />} value={`${active.length}`} label="Active habits" />
        </div>

        {/* Heatmap */}
        <section className="p-4 rounded-3xl bg-surface-low/70 backdrop-blur border border-outline-variant/30">
          <div className="text-[11px] font-bold tracking-[0.1em] text-on-surface-variant mb-2">LAST 16 WEEKS</div>
          <Heatmap data={Stats.heatmapAll(positives, 16)} />
        </section>

        {/* Breakdown */}
        <section className="flex flex-col gap-2">
          {active.length === 0 ? (
            <p className="text-center text-on-surface-variant py-10">No habits yet.</p>
          ) : (
            [...active]
              .sort((a, b) => Stats.currentStreak(b) - Stats.currentStreak(a))
              .map((h) => <BreakdownRow key={h.id} habit={h} />)
          )}
        </section>
      </div>
    </div>
  );
}

function Tile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="p-4 rounded-3xl bg-surface-low/70 backdrop-blur border border-outline-variant/30">
      <span className="text-accent">{icon}</span>
      <div className="text-3xl font-bold mt-1.5 tabular-nums">{value}</div>
      <div className="text-xs text-on-surface-variant">{label}</div>
    </div>
  );
}

function BreakdownRow({ habit }: { habit: Habit }) {
  const accent = habit.negative ? "var(--danger)" : "var(--accent)";
  const cur = Stats.currentStreak(habit);
  const unit = habit.negative
    ? "days clean"
    : habit.scheduleType === SCHEDULE_WEEKLY_COUNT
      ? "wk streak"
      : habit.scheduleType === SCHEDULE_MONTHLY_COUNT
        ? "mo streak"
        : "day streak";
  const rate = Stats.completionRate(habit, 30);
  const shownRate = habit.negative ? 100 - rate : rate;
  const Icon = iconFor(habit.emoji);

  return (
    <div className="flex items-center gap-3.5 p-3.5 rounded-[20px] bg-surface-lowest">
      <div className="grid place-items-center h-10 w-10 rounded-full shrink-0" style={{ background: "color-mix(in srgb, " + accent + " 16%, transparent)" }}>
        <Icon size={19} style={{ color: accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold truncate">{habit.name}</div>
        <div className="text-xs text-on-surface-variant">
          {cur} {unit} · {Stats.totalCompletions(habit)} done
        </div>
      </div>
      <div className="text-xl font-bold tabular-nums" style={{ color: accent }}>
        {shownRate}%
      </div>
    </div>
  );
}

/** 30-day completion rate aggregated across positive habits. Ported from native. */
function overallRate(positives: Habit[]): number {
  if (positives.length === 0) return 0;
  let scheduled = 0;
  let done = 0;
  let cursor = Stats.today();
  for (let i = 0; i < 30; i++) {
    const k = Stats.key(cursor);
    for (const h of positives) {
      if (Stats.isScheduledOn(h, cursor)) {
        scheduled += 1;
        if (h.completedDates.includes(k)) done += 1;
      }
    }
    cursor = Stats.addDays(cursor, -1);
  }
  return scheduled === 0 ? 0 : Math.round((done * 100) / scheduled);
}
