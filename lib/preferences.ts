import { config } from "./habitStats";

/**
 * Local UI preferences, persisted in localStorage (the web counterpart of the
 * native SharedPreferences / UserDefaults). `weekStartDay` and `dayStartHour`
 * feed the stats engine's module config so streaks/weeks render the user's way.
 */
export type ThemePref = "system" | "light" | "dark";

const KEYS = {
  theme: "pathivu-theme",
  weekStart: "pathivu-week-start",
  dayStart: "pathivu-day-start",
} as const;

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage disabled — ignore */
  }
}

export function getTheme(): ThemePref {
  const v = read(KEYS.theme);
  return v === "light" || v === "dark" ? v : "system";
}

export function setTheme(theme: ThemePref) {
  if (theme === "system") {
    try {
      localStorage.removeItem(KEYS.theme);
    } catch {
      /* ignore */
    }
  } else {
    write(KEYS.theme, theme);
  }
  applyThemeClass(theme);
}

export function applyThemeClass(theme: ThemePref) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.remove("light", "dark");
  if (theme === "light" || theme === "dark") el.classList.add(theme);
}

export function getWeekStart(): number {
  const v = Number(read(KEYS.weekStart));
  return v === 1 || v === 6 || v === 7 ? v : 1;
}

export function setWeekStart(day: number) {
  write(KEYS.weekStart, String(day));
  config.weekStartDay = day;
}

export function getDayStart(): number {
  const v = Number(read(KEYS.dayStart));
  return Number.isFinite(v) && v >= -3 && v <= 6 ? v : 0;
}

export function setDayStart(hour: number) {
  write(KEYS.dayStart, String(hour));
  config.dayStartHour = hour;
}

/** Load persisted prefs into the stats engine config. Call once on the client. */
export function hydratePreferences() {
  config.weekStartDay = getWeekStart();
  config.dayStartHour = getDayStart();
  applyThemeClass(getTheme());
}
