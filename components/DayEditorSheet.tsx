"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet } from "./Sheet";
import { useApp } from "./AppProvider";
import * as Stats from "@/lib/habitStats";
import { iconFor } from "@/lib/constants";
import { analytics } from "@/lib/analytics";

/** Back-fill editor: pick any past day and toggle each habit for that date. */
export function DayEditorSheet({
  open,
  initialDate,
  onClose,
}: {
  open: boolean;
  initialDate: Date;
  onClose: () => void;
}) {
  const { habits, toggleDay } = useApp();
  const [selected, setSelected] = useState(initialDate);

  useEffect(() => {
    if (open) analytics.screenDayEditorOpen();
  }, [open]);

  const today = Stats.today();
  const atToday = selected >= today;

  // Active habits + archived ones that still carry history (so the calendar
  // keeps showing a deleted habit's past completions). Mirrors native.
  const rows = habits
    .filter((h) => !h.archived || h.completedDates.length > 0)
    .sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? 1 : -1;
      return a.sortOrder - b.sortOrder;
    });

  const title = (() => {
    if (selected.getTime() === today.getTime()) return "Today";
    if (selected.getTime() === Stats.addDays(today, -1).getTime()) return "Yesterday";
    return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(selected);
  })();
  const subtitle = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(selected);

  return (
    <Sheet open={open} onClose={onClose} title="Day editor">
      <div className="flex flex-col gap-3 pt-2">
        {/* Header navigation */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => setSelected(Stats.addDays(selected, -1))}
            aria-label="Previous day"
            className="grid place-items-center h-10 w-10 rounded-full hover:bg-surface-container active:scale-95 transition"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="text-center">
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-xs text-on-surface-variant">{subtitle}</div>
          </div>
          <button
            onClick={() => !atToday && setSelected(Stats.addDays(selected, 1))}
            disabled={atToday}
            aria-label="Next day"
            className="grid place-items-center h-10 w-10 rounded-full hover:bg-surface-container active:scale-95 transition disabled:opacity-30"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <label className="mx-auto text-sm text-accent font-medium">
          <input
            type="date"
            max={Stats.key(today)}
            value={Stats.key(selected)}
            onChange={(e) => {
              const d = e.target.value ? new Date(e.target.value + "T00:00:00") : today;
              setSelected(d > today ? today : d);
            }}
            className="bg-transparent outline-none cursor-pointer"
          />
        </label>

        {rows.length === 0 ? (
          <p className="text-center text-on-surface-variant py-10">No habits to log yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5 pb-2">
            {rows.map((habit) => {
              const accent = habit.negative ? "var(--danger)" : "var(--accent)";
              const done = habit.completedDates.includes(Stats.key(selected));
              const Icon = iconFor(habit.emoji);
              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-3.5 p-3.5 rounded-[20px] bg-surface-lowest"
                  style={{ opacity: habit.archived ? 0.6 : 1 }}
                >
                  <div className="grid place-items-center h-[42px] w-[42px] rounded-full shrink-0" style={{ background: "color-mix(in srgb, " + accent + " 16%, transparent)" }}>
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{habit.name}</div>
                    <div className="text-xs text-on-surface-variant">
                      {habit.archived ? "Archived · " : ""}
                      {Stats.scheduleLabel(habit)}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleDay(habit, selected)}
                    aria-label={done ? "Mark not done" : "Mark done"}
                    className="grid place-items-center h-[42px] w-[42px] rounded-full shrink-0"
                    style={{ background: done ? accent : "color-mix(in srgb, var(--on-surface-variant) 14%, transparent)" }}
                  >
                    <Check size={17} strokeWidth={3} style={{ color: done ? "#fff" : accent, opacity: done ? 1 : 0.5 }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Sheet>
  );
}
