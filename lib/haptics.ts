// Lightweight haptics via the Vibration API (Android Chrome). No-op where
// unsupported (iOS Safari ignores it) — purely an enhancement.
function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

export const haptics = {
  tick: () => vibrate(5),
  click: () => vibrate(10),
  success: () => vibrate([8, 30, 8]),
  warning: () => vibrate(20),
  error: () => vibrate([20, 40, 20]),
};
