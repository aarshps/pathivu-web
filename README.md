# Pathivu Web

A web version of **Pathivu** (*പതിവ്*) — the habit tracker that also ships on
[Android](../pathivu-android) and [iOS](../pathivu-ios). This is **not a separate
product**: it signs in with the same Google account and reads/writes the **same
Firestore documents** (`users/{uid}/habits/{habitId}`) in the shared
`hora-pathivu` Firebase project, so habits, streaks and history sync live across
web, Android and iOS.

Built with Next.js (App Router) + Firebase Web SDK + Tailwind v4, deployed on
Vercel. Installable as a PWA.

**Live:** [pathivu-web.vercel.app](https://pathivu-web.vercel.app) — auto-deploys
from `main` (PRs get preview deployments).

## What's here

- **Domain layer** ported 1:1 from the native apps — the wire-identical `Habit`
  model (`lib/habit.ts`), the pure stats engine (`lib/habitStats.ts`, a port of
  `HabitStats.swift`/`.kt`), the 27-icon catalogue (`lib/constants.ts`) and the
  hero-state logic (`lib/heroState.ts`). Unit tests: `lib/habitStats.test.ts`.
- **Data/auth** — `lib/firebase.ts`, `lib/auth.ts` (Google sign-in),
  `lib/firestore.ts` (live `onSnapshot`, atomic `arrayUnion`/`arrayRemove` day
  toggles, archive/restore/delete, drag reorder). Offline-first via Firestore's
  IndexedDB persistent cache.
- **Screens** — Home (hero ring + reorderable habit list + day editor sheet +
  add/edit sheet), Stats (`/stats`: tiles + 16-week heatmap + breakdown),
  Settings (`/settings`: theme, week-start, day-start, archived habits, account).
- **Analytics** — `lib/analytics.ts`, a Firebase Analytics (GA4) wrapper whose
  event names mirror the native `Analytics.kt`/`.swift` 1:1 (`habit_*`,
  `screen_*`, `setting_*`, `auth_*`), booted on app mount.

### v1 scope

Core parity: Google sign-in, full habit CRUD + completion tracking, stats and
heatmap, day editor, settings. **Out of scope for v1** (extension points left in
place): web-push daily reminders, biometric app-lock, Apple sign-in on web,
account deletion, Malayalam UI localization.

## Develop

```bash
cp .env.example .env.local   # fill in NEXT_PUBLIC_FIREBASE_* (see below)
npm install
npm run dev                  # http://localhost:3000
npm test                     # stats-engine unit tests
npm run build                # production build
```

## Firebase setup (already done)

The web client uses the shared `hora-pathivu` Firebase project. The one-time
setup is complete:

- A **Web app** ("Pathivu Web") is registered → `NEXT_PUBLIC_FIREBASE_APP_ID`.
- **Google Analytics** is enabled on the project (GA4), giving the web data
  stream `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` — this also activates analytics
  collection for the Android/iOS apps.
- The Vercel domains (`pathivu-web.vercel.app` + `-aarshps` variants) are added
  to **Authentication → Settings → Authorized domains** so Google sign-in is
  allowed there.
- **Google** sign-in is enabled; Firestore rules scope `users/{uid}/**` to the
  owner — the web client uses the same rules.

> Firebase web config is **public by design** (it ships in every client);
> security is enforced by Firestore rules, not by hiding these values.

## Deploy (Vercel team `aarshps`, project `pathivu-web`)

The GitHub repo is connected, so deployment is automatic:

- Push to **`main`** → production deploy at `pathivu-web.vercel.app`.
- Open a **PR / push a branch** → preview deploy.
- Manual deploy if needed: `npx vercel deploy --prod`.

`NEXT_PUBLIC_FIREBASE_*` are set in the Vercel project (Production). **Note:** the
same vars still need adding to the **Preview** environment for PR previews to have
working Firebase — set them in *Settings → Environment Variables* (check Preview)
or `vercel env add … preview`.

## Verify end-to-end

Sign in with the same Google account you use on the Android app and confirm your
existing habits, streaks and heatmap appear and match. Toggle a habit on web and
watch it reflect on the phone within seconds (and vice-versa) — proof the web
client writes the identical Firestore documents.
