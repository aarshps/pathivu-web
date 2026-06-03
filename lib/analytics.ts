import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";
import { app } from "./firebase";

/**
 * Thin wrapper around Firebase Analytics (GA4) mirroring the native
 * `AppAnalytics` surface (pathivu-ios `Analytics.swift` / android `Analytics.kt`)
 * so dashboards stay readable across web/Android/iOS — same event names, same
 * scalar params.
 *
 * **Invariant (matches native):** scalar params only — never log habit names,
 * document IDs, or other high-cardinality text.
 *
 * Lazily initialised on the client, guarded by `isSupported()` and the presence
 * of a measurementId, so it no-ops during SSR / unsupported browsers / when GA
 * isn't configured.
 */
let analyticsPromise: Promise<Analytics | null> | null = null;

function instance(): Promise<Analytics | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((ok) => (ok ? getAnalytics(app) : null))
      .catch(() => null);
  }
  return analyticsPromise;
}

function track(event: string, params?: Record<string, unknown>) {
  void instance().then((a) => {
    if (a) logEvent(a, event, params);
  });
}

export const analytics = {
  // Habit flows
  habitAddOpen: () => track("habit_add_open"),
  habitEditOpen: () => track("habit_edit_open"),
  habitSave: (isNew: boolean, schedule: string) =>
    track("habit_save", { is_new: isNew, schedule }),
  habitToggle: (done: boolean) => track("habit_toggle", { done }),
  habitToggleBackfill: () => track("habit_toggle_backfill"),
  habitArchive: () => track("habit_archive"),
  habitRestore: () => track("habit_restore"),
  habitDelete: () => track("habit_delete"),
  habitReorder: () => track("habit_reorder"),

  // Navigation / screens
  homeRefreshPull: () => track("home_refresh_pull"),
  screenStatsOpen: () => track("screen_stats_open"),
  screenSettingsOpen: () => track("screen_settings_open"),
  screenDayEditorOpen: () => track("screen_day_editor_open"),
  screenArchivedOpen: () => track("screen_archived_open"),

  // Settings
  settingThemeChange: (theme: string) => track("setting_theme_change", { theme }),
  settingDayStartChange: (offset: number) => track("setting_day_start_change", { offset }),
  settingWeekStartChange: (iso: number) => track("setting_week_start_change", { iso }),

  // Auth
  authSignIn: (provider: string) => track("auth_sign_in", { provider }),
  authSignOut: () => track("auth_sign_out"),
};
