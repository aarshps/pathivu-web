"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Flame, GripVertical } from "lucide-react";
import { type Habit, SCHEDULE_MONTHLY_COUNT, SCHEDULE_WEEKLY_COUNT } from "@/lib/habit";
import * as Stats from "@/lib/habitStats";
import { iconFor } from "@/lib/constants";
import { WeekDots } from "./WeekDots";
import { haptics } from "@/lib/haptics";

/** One habit card on the home list. Mirrors the native HabitRow / HabitAdapter item. */
export function HabitRow({
  habit,
  onToggle,
  onTap,
}: {
  habit: Habit;
  onToggle: () => void;
  onTap: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id! });
  const [pop, setPop] = useState(false);

  const accent = habit.negative ? "var(--danger)" : "var(--accent)";
  const dueToday = Stats.isDueToday(habit);
  const doneToday = Stats.isDoneToday(habit);
  const streak = Stats.currentStreak(habit);
  const Icon = iconFor(habit.emoji);

  const scheduleText = (() => {
    if (habit.negative) return "Avoid daily";
    if (habit.scheduleType === SCHEDULE_MONTHLY_COUNT) {
      const p = Stats.monthProgress(habit);
      return `${p.done}/${p.target} this month`;
    }
    if (habit.scheduleType === SCHEDULE_WEEKLY_COUNT) {
      const p = Stats.weekProgress(habit);
      return `${p.done}/${p.target} this week`;
    }
    return dueToday ? Stats.scheduleLabel(habit) : "Rest day";
  })();

  function check(e: React.MouseEvent) {
    e.stopPropagation();
    haptics.success();
    setPop(true);
    setTimeout(() => setPop(false), 180);
    onToggle();
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : dueToday ? 1 : 0.65,
        zIndex: isDragging ? 10 : undefined,
      }}
      onClick={onTap}
      className="group flex items-center gap-3.5 p-3.5 rounded-[26px] bg-surface-low/70 backdrop-blur border border-outline-variant/30 shadow-sm cursor-pointer select-none"
    >
      {/* Avatar */}
      <div
        className="relative grid place-items-center h-[46px] w-[46px] rounded-full shrink-0"
        style={{ background: habit.negative ? "color-mix(in srgb, var(--danger) 18%, transparent)" : "var(--accent-soft)" }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{habit.name}</span>
          {streak > 0 && (
            <span className="flex items-center gap-0.5 text-xs font-medium shrink-0" style={{ color: accent }}>
              <Flame size={12} />
              {habit.negative ? `${streak} clean` : streak}
            </span>
          )}
        </div>
        <div className="text-xs text-on-surface-variant">{scheduleText}</div>
        <WeekDots habit={habit} accent={accent} />
      </div>

      {/* Drag handle (appears on hover / always on touch) */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Reorder"
        className="touch-none cursor-grab active:cursor-grabbing text-on-surface-variant/50 hover:text-on-surface-variant px-0.5"
      >
        <GripVertical size={18} />
      </button>

      {/* Check */}
      <button
        onClick={check}
        aria-label={doneToday ? "Mark not done" : "Mark done"}
        className="grid place-items-center h-[46px] w-[46px] rounded-full shrink-0 transition-transform"
        style={{
          background: doneToday ? accent : "color-mix(in srgb, var(--on-surface-variant) 14%, transparent)",
          transform: pop ? "scale(0.8)" : "scale(1)",
        }}
      >
        <Check
          size={18}
          strokeWidth={3}
          style={{ color: doneToday ? "#fff" : accent, opacity: doneToday ? 1 : dueToday ? 0.55 : 0.3 }}
        />
      </button>
    </div>
  );
}
