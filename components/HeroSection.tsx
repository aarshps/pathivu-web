"use client";

import {
  type HeroState,
  progress,
  heroLabel,
  heroTitle,
  heroCenter,
  heroSubtitle,
} from "@/lib/heroState";

/**
 * The "today" hero: a circular progress ring with the done/due count, a
 * motivational title and a streak/slip subtitle. Mirrors the native HeroSection.
 */
export function HeroSection({ hero, onClick }: { hero: HeroState; onClick?: () => void }) {
  const p = Math.max(0.001, progress(hero));
  const sub = heroSubtitle(hero);
  const R = 42;
  const C = 2 * Math.PI * R;

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-5 p-[22px] rounded-[32px] bg-surface-low/70 backdrop-blur border border-outline-variant/30 shadow-sm active:scale-[0.995] transition"
    >
      <div className="relative shrink-0" style={{ width: 92, height: 92 }}>
        <svg width={92} height={92} viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--on-surface-variant)" strokeOpacity={0.18} strokeWidth={10} />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - p)}
            style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.2,0.8,0.2,1)" }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-xl font-bold tabular-nums">
          {heroCenter(hero)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold tracking-[0.15em] text-accent">{heroLabel(hero)}</div>
        <div className="text-xl font-semibold truncate">{heroTitle(hero)}</div>
        <div className={`text-sm ${sub.isSlip ? "text-danger" : "text-on-surface-variant"}`}>
          {sub.text}
        </div>
      </div>
    </button>
  );
}
