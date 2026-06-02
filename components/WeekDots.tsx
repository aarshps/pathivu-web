"use client";

import { type Habit } from "@/lib/habit";
import { weekRow, type DayStatus } from "@/lib/habitStats";

/** The 7-dot week strip under a habit name. Mirrors the native weekDots. */
export function WeekDots({ habit, accent }: { habit: Habit; accent: string }) {
  const row = weekRow(habit);
  return (
    <div className="flex items-center gap-1.5 pt-0.5">
      {row.map((cell, i) => (
        <Dot key={i} status={cell.status} accent={accent} />
      ))}
    </div>
  );
}

function Dot({ status, accent }: { status: DayStatus; accent: string }) {
  const base = "block h-[9px] w-[9px] rounded-full";
  switch (status) {
    case "done":
      return <span className={base} style={{ background: accent }} />;
    case "todayPending":
      return <span className={base} style={{ border: `2px solid ${accent}` }} />;
    case "missed":
      return <span className={base} style={{ background: "var(--on-surface-variant)", opacity: 0.35 }} />;
    case "notScheduled":
      return <span className={base} style={{ background: "var(--on-surface-variant)", opacity: 0.15 }} />;
    case "future":
      return <span className={base} style={{ background: "var(--on-surface-variant)", opacity: 0.12 }} />;
  }
}
