# Pathivu Web

A web version of **Pathivu** (*പതിവ്*) — the habit tracker that also ships on
[Android](../pathivu-android) and [iOS](../pathivu-ios). This is **not a separate
product**: it signs in with the same Google account and reads/writes the **same
Firestore documents** (`users/{uid}/habits/{habitId}`) in the shared
`hora-pathivu` Firebase project, so habits, streaks and history sync live across
web, Android and iOS.

Built with Next.js (App Router) + Firebase Web SDK + Tailwind v4, deployed on
Vercel. Installable as a PWA.

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

## Firebase setup (one-time)

The `hora-pathivu` project already exists (used by the native apps). For the web
client:

1. **Register a Web app** in the Firebase console for `hora-pathivu` → copy its
   `appId` (`1:957084965409:web:...`) into `NEXT_PUBLIC_FIREBASE_APP_ID`. The
   other config values are already public (from `google-services.json`) and are
   pre-filled in `.env.example` / `.env.local`.
2. **Authentication → Settings → Authorized domains** — add `localhost` (already
   there) and your Vercel domains (`pathivu.vercel.app` + any custom/preview
   domain). Without this, Google sign-in is rejected on those origins.
3. Confirm **Google** is enabled as a sign-in provider (it is, for the native
   apps). Confirm Firestore rules still scope `users/{uid}/**` to the owner — the
   web client uses the same rules.

> Firebase web config is **public by design** (it ships in every client);
> security is enforced by Firestore rules, not by hiding these values.

## Deploy to Vercel (team `aarshps`)

1. Push this repo to GitHub and import it into the `aarshps` Vercel team.
2. Add the `NEXT_PUBLIC_FIREBASE_*` environment variables (same values as
   `.env.local`) in the Vercel project settings.
3. Deploy. Then add the resulting domain to Firebase **Authorized domains**
   (step 2 above).

## Verify end-to-end

Sign in with the same Google account you use on the Android app and confirm your
existing habits, streaks and heatmap appear and match. Toggle a habit on web and
watch it reflect on the phone within seconds (and vice-versa) — proof the web
client writes the identical Firestore documents.
