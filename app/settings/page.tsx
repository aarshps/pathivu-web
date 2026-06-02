"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, RotateCcw, Trash2, Archive } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { signOut } from "@/lib/auth";
import { restoreHabit, deleteHabit } from "@/lib/firestore";
import {
  getTheme,
  setTheme,
  getWeekStart,
  setWeekStart,
  getDayStart,
  setDayStart,
  type ThemePref,
} from "@/lib/preferences";
import { iconFor } from "@/lib/constants";

const WEEK_OPTIONS = [
  { iso: 1, label: "Monday" },
  { iso: 7, label: "Sunday" },
  { iso: 6, label: "Saturday" },
];
const DAY_OFFSETS = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

function dayStartLabel(offset: number): string {
  if (offset === 0) return "Midnight (12 AM)";
  const hour = ((offset % 24) + 24) % 24;
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d);
}

export default function SettingsPage() {
  const { user, habits } = useApp();
  const router = useRouter();

  const [theme, setThemeState] = useState<ThemePref>("system");
  const [weekStart, setWeekStartState] = useState(1);
  const [dayStart, setDayStartState] = useState(0);

  useEffect(() => {
    setThemeState(getTheme());
    setWeekStartState(getWeekStart());
    setDayStartState(getDayStart());
  }, []);

  const archived = habits.filter((h) => h.archived);

  async function doSignOut() {
    if (!confirm("Sign out? You can sign back in anytime — your habits stay safely synced.")) return;
    await signOut();
    router.push("/");
  }

  return (
    <div className="mx-auto w-full max-w-lg min-h-dvh px-4 pb-16">
      <header className="flex items-center gap-2 py-3 sticky top-0 z-20">
        <Link href="/" aria-label="Back" className="grid place-items-center h-9 w-9 rounded-full text-on-surface-variant hover:bg-surface-container transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="flex-1 text-center text-lg font-extrabold tracking-tight">Settings</h1>
        <span className="w-9" />
      </header>

      <div className="flex flex-col gap-5">
        {/* Appearance */}
        <Section title="Appearance">
          <Row label="Theme">
            <Segmented
              options={[
                { value: "system", label: "Auto" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
              selected={theme}
              onSelect={(v) => {
                setTheme(v as ThemePref);
                setThemeState(v as ThemePref);
              }}
            />
          </Row>
        </Section>

        {/* Tracking */}
        <Section title="Tracking">
          <Row label="New day starts at">
            <select
              value={dayStart}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDayStart(v);
                setDayStartState(v);
              }}
              className="bg-surface-container rounded-xl px-3 py-2 text-sm outline-none"
            >
              {DAY_OFFSETS.map((o) => (
                <option key={o} value={o}>
                  {dayStartLabel(o)}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Start of week">
            <select
              value={weekStart}
              onChange={(e) => {
                const v = Number(e.target.value);
                setWeekStart(v);
                setWeekStartState(v);
              }}
              className="bg-surface-container rounded-xl px-3 py-2 text-sm outline-none"
            >
              {WEEK_OPTIONS.map((o) => (
                <option key={o.iso} value={o.iso}>
                  {o.label}
                </option>
              ))}
            </select>
          </Row>
          <p className="text-xs text-on-surface-variant px-1">
            These take full effect on your next visit to the home and stats screens.
          </p>
        </Section>

        {/* Archived habits */}
        <Section title={`Archived habits${archived.length ? ` (${archived.length})` : ""}`}>
          {archived.length === 0 ? (
            <div className="flex items-center gap-2 text-on-surface-variant text-sm px-1 py-2">
              <Archive size={16} /> Nothing archived.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {archived.map((h) => {
                const Icon = iconFor(h.emoji);
                return (
                  <div key={h.id} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-lowest">
                    <div className="grid place-items-center h-9 w-9 rounded-full bg-surface-container shrink-0">
                      <Icon size={17} className="text-on-surface-variant" />
                    </div>
                    <span className="flex-1 truncate font-medium">{h.name}</span>
                    <button
                      onClick={() => user && h.id && restoreHabit(user.uid, h.id)}
                      aria-label="Restore"
                      className="grid place-items-center h-9 w-9 rounded-full text-on-surface-variant hover:bg-surface-container transition"
                    >
                      <RotateCcw size={17} />
                    </button>
                    <button
                      onClick={() => {
                        if (user && h.id && confirm(`Permanently delete "${h.name}" and all its history? This can't be undone.`)) {
                          deleteHabit(user.uid, h.id);
                        }
                      }}
                      aria-label="Delete permanently"
                      className="grid place-items-center h-9 w-9 rounded-full text-danger hover:bg-surface-container transition"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Account */}
        <Section title="Account">
          <Row label="Signed in as">
            <span className="text-sm text-on-surface-variant truncate max-w-[60%]">{user?.email ?? "—"}</span>
          </Row>
          <button
            onClick={doSignOut}
            className="flex items-center gap-2 w-full text-left px-1 py-2.5 font-medium text-danger"
          >
            <LogOut size={18} /> Sign out
          </button>
        </Section>

        {/* About */}
        <Section title="About">
          <a className="block px-1 py-2 text-on-surface" href="https://github.com/aarshps/pathivu-android/blob/main/PRIVACY.md" target="_blank" rel="noreferrer">
            Privacy policy
          </a>
          <a className="block px-1 py-2 text-on-surface" href="https://github.com/aarshps/pathivu-android/blob/main/DATA_DELETION.md" target="_blank" rel="noreferrer">
            Data deletion
          </a>
          <p className="text-xs text-on-surface-variant px-1 pt-2">Pathivu Web · synced with the Pathivu app</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[11px] font-bold tracking-[0.1em] text-on-surface-variant px-1 mb-2 uppercase">{title}</h2>
      <div className="rounded-3xl bg-surface-low/70 backdrop-blur border border-outline-variant/30 p-3 flex flex-col gap-1">
        {children}
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-1.5">
      <span className="font-medium">{label}</span>
      {children}
    </div>
  );
}

function Segmented({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-surface-container">
      {options.map((o) => {
        const on = o.value === selected;
        return (
          <button
            key={o.value}
            onClick={() => onSelect(o.value)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition"
            style={{ background: on ? "var(--accent)" : "transparent", color: on ? "#fff" : "var(--on-surface-variant)" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
