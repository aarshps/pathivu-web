"use client";

/**
 * GitHub-style contribution grid. `data` is weeks × 7 day-cells; `-1` = future.
 * Color rule mirrors the native HeatmapGrid.
 */
export function Heatmap({ data }: { data: number[][] }) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
      {data.map((week, w) => (
        <div key={w} className="flex flex-col gap-1">
          {week.map((intensity, d) => (
            <span
              key={d}
              className="block rounded-[4px]"
              style={{ width: 15, height: 15, background: cellColor(intensity) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function cellColor(intensity: number): string {
  if (intensity < 0) return "transparent"; // future
  if (intensity === 0) return "color-mix(in srgb, var(--on-surface-variant) 14%, transparent)";
  const opacity = 0.25 + intensity * 0.75;
  return `color-mix(in srgb, var(--accent) ${Math.round(opacity * 100)}%, transparent)`;
}
