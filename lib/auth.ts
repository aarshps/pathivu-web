import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

/** Subscribe to auth changes. Returns an unsubscribe function. */
export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

/** Resolve a pending redirect sign-in (mobile fallback path). Safe to call always. */
export async function completeRedirectSignIn(): Promise<void> {
  try {
    await getRedirectResult(auth);
  } catch {
    // No pending redirect, or it failed — onAuthStateChanged remains the source of truth.
  }
}

/**
 * Google sign-in. Popup on desktop; falls back to full-page redirect on mobile
 * browsers where popups are unreliable. Same accounts as the native apps, so the
 * user's existing habits appear immediately.
 */
export async function signInWithGoogle(): Promise<void> {
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (isMobile) {
    await signInWithRedirect(auth, googleProvider);
    return;
  }
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    // Popup blocked / closed → retry via redirect.
    if (
      code === "auth/popup-blocked" ||
      code === "auth/cancelled-popup-request" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    if (code === "auth/popup-closed-by-user") return; // user dismissed — no-op
    throw e;
  }
}

export function signOut(): Promise<void> {
  return fbSignOut(auth);
}
