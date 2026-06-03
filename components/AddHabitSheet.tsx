"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Sheet } from "./Sheet";
import {
  type Habit,
  defaultHabit,
  type ScheduleType,
  SCHEDULE_DAILY,
  SCHEDULE_WEEKLY,
  SCHEDULE_WEEKLY_COUNT,
  SCHEDULE_MONTHLY_COUNT,
} from "@/lib/habit";
import { HABIT_ICONS, iconFor, DAY_LABELS } from "@/lib/constants";
import { createHabit, updateHabit, archiveHabit } from "@/lib/firestore";
import { useApp } from "./AppProvider";
import { haptics } from "@/lib/haptics";
import { analytics } from "@/lib/analytics";

/** Create / edit a habit. Mirrors the native AddHabitSheet. */
export function AddHabitSheet({
  open,
  habit,
  onClose,
}: {
  open: boolean;
  habit: Habit | null;
  onClose: () => void;
}) {
  const { user } = useApp();
  const editing = !!habit?.id;

  const [name, setName] = useState(habit?.name ?? "");
  const [icon, setIcon] = useState(habit?.emoji ?? HABIT_ICONS[0].key);
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    (habit?.scheduleType as ScheduleType) ?? SCHEDULE_DAILY,
  );
  const [days, setDays] = useState<Set<number>>(
    new Set(habit?.daysOfWeek?.length ? habit.daysOfWeek : [1, 2, 3, 4, 5, 6, 7]),
  );
  const [weeklyTarget, setWeeklyTarget] = useState(Math.min(Math.max(habit?.weeklyTarget ?? 5, 1), 7));
  const [monthlyTarget, setMonthlyTarget] = useState(Math.min(Math.max(habit?.monthlyTarget ?? 10, 1), 28));
  const [negative, setNegative] = useState(habit?.negative ?? false);
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);

  const accent = negative ? "var(--danger)" : "var(--accent)";
  const SelIcon = iconFor(icon);

  useEffect(() => {
    if (open) (editing ? analytics.habitEditOpen : analytics.habitAddOpen)();
  }, [open, editing]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      haptics.error();
      return;
    }
    if (!user) return;
    haptics.success();
    setSaving(true);
    const finalSchedule: ScheduleType = negative ? SCHEDULE_DAILY : scheduleType;
    const finalDays =
      finalSchedule === SCHEDULE_WEEKLY
        ? days.size
          ? [...days].sort((a, b) => a - b)
          : [1, 2, 3, 4, 5, 6, 7]
        : [1, 2, 3, 4, 5, 6, 7];

    const fields = {
      name: trimmed,
      emoji: icon,
      scheduleType: finalSchedule,
      daysOfWeek: finalDays,
      weeklyTarget,
      monthlyTarget,
      negative,
    };

    try {
      if (editing && habit?.id) await updateHabit(user.uid, habit.id, fields);
      else await createHabit(user.uid, { ...defaultHabit(), ...fields });
      analytics.habitSave(!editing, negative ? "negative" : finalSchedule);
      onClose();
    } catch {
      setSaving(false);
      haptics.error();
    }
  }

  async function archive() {
    if (!user || !habit?.id) return;
    if (!confirm(`Delete "${habit.name}"? Its history stays in the calendar; remove it permanently later from Settings → Archived habits.`)) return;
    haptics.warning();
    await archiveHabit(user.uid, habit.id);
    analytics.habitArchive();
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit habit" : "New habit"}
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full py-3 font-semibold bg-surface-container text-on-surface active:scale-[0.98] transition">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-full py-3 font-semibold bg-primary text-on-primary active:scale-[0.98] transition disabled:opacity-60"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-2">
        {/* Name + avatar */}
        <div className="flex items-center gap-3.5 p-4 rounded-3xl bg-surface-lowest">
          <div className="grid place-items-center h-14 w-14 rounded-full shrink-0" style={{ background: negative ? "color-mix(in srgb, var(--danger) 16%, transparent)" : "var(--accent-soft)" }}>
            <SelIcon size={24} style={{ color: accent }} />
          </div>
          <div className="flex-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(false);
              }}
              placeholder="Habit name"
              className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-on-surface-variant/60"
            />
            {nameError && <p className="text-xs text-danger mt-0.5">Give your habit a name</p>}
          </div>
        </div>

        {/* Build / Quit */}
        <div className="p-4 rounded-3xl bg-surface-lowest">
          <Segmented
            options={[
              { value: false, label: "Build" },
              { value: true, label: "Quit" },
            ]}
            selected={negative}
            tint={negative ? "var(--danger)" : "var(--accent)"}
            onSelect={(v) => {
              haptics.tick();
              setNegative(v);
            }}
          />
          <p className="text-sm text-on-surface-variant mt-3">
            {negative
              ? "A bad habit to quit. Marking it means you slipped today — it lowers today's score and resets your clean-day streak."
              : "A good habit to build and repeat."}
          </p>
        </div>

        {/* Icon */}
        <div className="p-4 rounded-3xl bg-surface-lowest">
          <Label>ICON</Label>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 mt-2">
            {HABIT_ICONS.map((ic) => {
              const on = icon === ic.key;
              const I = ic.Icon;
              return (
                <button
                  key={ic.key}
                  onClick={() => {
                    haptics.tick();
                    setIcon(ic.key);
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <span
                    className="grid place-items-center h-12 w-12 rounded-full transition"
                    style={{ background: on ? accent : "color-mix(in srgb, var(--on-surface-variant) 14%, transparent)" }}
                  >
                    <I size={20} style={{ color: on ? "#fff" : "var(--on-surface-variant)" }} />
                  </span>
                  <span className="text-[11px] text-on-surface-variant w-13 text-center truncate" style={{ width: 52 }}>
                    {ic.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule (hidden for quit habits) */}
        {!negative && (
          <div className="p-4 rounded-3xl bg-surface-lowest">
            <Label>SCHEDULE</Label>
            <div className="mt-2">
              <Segmented
                options={[
                  { value: SCHEDULE_DAILY, label: "Daily" },
                  { value: SCHEDULE_WEEKLY, label: "Days" },
                  { value: SCHEDULE_WEEKLY_COUNT, label: "×/wk" },
                  { value: SCHEDULE_MONTHLY_COUNT, label: "×/mo" },
                ]}
                selected={scheduleType}
                tint="var(--accent)"
                onSelect={(v) => {
                  haptics.tick();
                  setScheduleType(v as ScheduleType);
                }}
              />
            </div>

            {scheduleType === SCHEDULE_WEEKLY && (
              <div className="flex gap-2 mt-4 justify-between">
                {[1, 2, 3, 4, 5, 6, 7].map((iso) => {
                  const on = days.has(iso);
                  return (
                    <button
                      key={iso}
                      onClick={() => {
                        haptics.tick();
                        const next = new Set(days);
                        if (on) next.delete(iso);
                        else next.add(iso);
                        setDays(next);
                      }}
                      className="grid place-items-center h-9 w-9 rounded-full text-sm font-semibold transition"
                      style={{
                        background: on ? "var(--accent)" : "color-mix(in srgb, var(--on-surface-variant) 14%, transparent)",
                        color: on ? "#fff" : "var(--on-surface)",
                      }}
                    >
                      {DAY_LABELS[iso - 1]}
                    </button>
                  );
                })}
              </div>
            )}

            {scheduleType === SCHEDULE_WEEKLY_COUNT && (
              <Counter value={weeklyTarget} min={1} max={7} suffix="× per week" onChange={setWeeklyTarget} />
            )}
            {scheduleType === SCHEDULE_MONTHLY_COUNT && (
              <Counter value={monthlyTarget} min={1} max={28} suffix="× per month" onChange={setMonthlyTarget} />
            )}
          </div>
        )}

        {editing && (
          <button
            onClick={archive}
            className="flex items-center justify-center gap-2 rounded-full py-3 font-semibold text-danger bg-surface-container active:scale-[0.98] transition"
          >
            <Trash2 size={18} /> Delete habit
          </button>
        )}
      </div>
    </Sheet>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold tracking-[0.1em] text-on-surface-variant">{children}</div>;
}

function Segmented<T>({
  options,
  selected,
  tint,
  onSelect,
}: {
  options: { value: T; label: string }[];
  selected: T;
  tint: string;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "color-mix(in srgb, var(--on-surface-variant) 12%, transparent)" }}>
      {options.map((o, i) => {
        const on = o.value === selected;
        return (
          <button
            key={i}
            onClick={() => onSelect(o.value)}
            className="flex-1 rounded-xl py-2 text-sm font-medium transition"
            style={{ background: on ? tint : "transparent", color: on ? "#fff" : "var(--on-surface-variant)" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Counter({
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <div className="font-medium">
        {value} {suffix}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
    </div>
  );
}
