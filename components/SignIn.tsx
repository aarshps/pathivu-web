"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";
import { analytics } from "@/lib/analytics";

/** Sign-in gate. Google only (same accounts as the native apps → instant sync). */
export function SignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      analytics.authSignIn("google");
      await signInWithGoogle();
    } catch {
      setError("Sign-in failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <div className="grid place-items-center h-20 w-20 rounded-[28px] bg-accent text-on-accent text-4xl font-extrabold shadow-lg">
        പ
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Pathivu</h1>
      <p className="mt-2 max-w-xs text-on-surface-variant">
        Build good habits, quit bad ones — synced across all your devices.
      </p>

      <button
        onClick={go}
        disabled={busy}
        className="mt-8 inline-flex items-center gap-3 rounded-full bg-primary text-on-primary px-6 py-3.5 font-semibold shadow active:scale-[0.98] transition disabled:opacity-60"
      >
        <GoogleGlyph />
        {busy ? "Signing in…" : "Continue with Google"}
      </button>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <p className="mt-10 text-xs text-on-surface-variant/80">
        Your habits stay private and synced via your account.
      </p>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 16 3 9.1 7.6 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 36.3 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9 41.4 15.9 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.3 5.2C39.9 41.1 44 35.2 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
