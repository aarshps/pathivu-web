import { describe, it, expect, beforeEach } from "vitest";
import { defaultHabit, type Habit, SCHEDULE_WEEKLY, SCHEDULE_WEEKLY_COUNT } from "./habit";
import * as Stats from "./habitStats";

// Build a habit with completions on the given Date offsets from today.
function habitWithDoneOffsets(offsets: number[], over: Partial<Habit> = {}): Habit {
  const t = Stats.today();
  return {
    ...defaultHabit(),
    completedDates: offsets.map((o) => Stats.key(Stats.addDays(t, o))),
    createdAt: Stats.addDays(t, -400),
    ...over,
  };
}

beforeEach(() => {
  Stats.config.dayStartHour = 0;
  Stats.config.weekStartDay = 1;
});

describe("dailyStreak", () => {
  it("counts consecutive days ending today", () => {
    const h = habitWithDoneOffsets([0, -1, -2, -3]);
    expect(Stats.currentStreak(h)).toBe(4);
  });

  it("today pending does not break the streak (counts to yesterday)", () => {
    const h = habitWithDoneOffsets([-1, -2, -3]);
    expect(Stats.currentStreak(h)).toBe(3);
  });

  it("a gap breaks the streak", () => {
    const h = habitWithDoneOffsets([0, -1, -3, -4]);
    expect(Stats.currentStreak(h)).toBe(2);
  });

  it("empty completions => 0", () => {
    expect(Stats.currentStreak(habitWithDoneOffsets([]))).toBe(0);
  });
});

describe("cleanStreak (negative habit)", () => {
  it("slip today => 0", () => {
    const h = habitWithDoneOffsets([0], { negative: true });
    expect(Stats.currentStreak(h)).toBe(0);
  });

  it("counts clean days since the last slip (inclusive of today)", () => {
    // Last slip 3 days ago -> clean days are -2,-1,0 = 3.
    const h = habitWithDoneOffsets([-3], { negative: true });
    expect(Stats.currentStreak(h)).toBe(3);
  });
});

describe("weeklyStreak (x per week)", () => {
  it("meeting the target this week counts once", () => {
    // One completion today with target 1 guarantees this week is met,
    // regardless of where today falls relative to the week boundary.
    const h = habitWithDoneOffsets([0], {
      scheduleType: SCHEDULE_WEEKLY_COUNT,
      weeklyTarget: 1,
    });
    expect(Stats.currentStreak(h)).toBeGreaterThanOrEqual(1);
  });
});

describe("isScheduledOn (specific weekdays)", () => {
  it("respects daysOfWeek", () => {
    const t = Stats.today();
    const iso = Stats.isoWeekday(t);
    const h: Habit = {
      ...defaultHabit(),
      scheduleType: SCHEDULE_WEEKLY,
      daysOfWeek: [iso],
    };
    expect(Stats.isScheduledOn(h, t)).toBe(true);
    expect(Stats.isScheduledOn(h, Stats.addDays(t, 1))).toBe(iso === Stats.isoWeekday(Stats.addDays(t, 1)));
  });
});

describe("completionRate", () => {
  it("100% when every scheduled day in window is done", () => {
    const offsets = Array.from({ length: 30 }, (_, i) => -i);
    const h = habitWithDoneOffsets(offsets);
    expect(Stats.completionRate(h, 30)).toBe(100);
  });

  it("0% with no completions", () => {
    expect(Stats.completionRate(habitWithDoneOffsets([]), 30)).toBe(0);
  });
});

describe("longestStreak", () => {
  it("finds the best consecutive run regardless of schedule", () => {
    const h = habitWithDoneOffsets([0, -1, -2, -10, -11]);
    expect(Stats.longestStreak(h)).toBe(3);
  });
});

describe("heatmapAll", () => {
  it("returns 16 weeks x 7 days, future marked -1", () => {
    const grid = Stats.heatmapAll([habitWithDoneOffsets([0])], 16);
    expect(grid.length).toBe(16);
    expect(grid[0].length).toBe(7);
    // Some future cells exist in the final column (after today within this week).
    const flat = grid.flat();
    expect(flat).toContain(-1);
  });
});

describe("scheduleLabel", () => {
  it("daily for all 7 weekdays", () => {
    const h: Habit = { ...defaultHabit(), scheduleType: SCHEDULE_WEEKLY, daysOfWeek: [1, 2, 3, 4, 5, 6, 7] };
    expect(Stats.scheduleLabel(h)).toBe("Daily");
  });
  it("lists weekdays", () => {
    const h: Habit = { ...defaultHabit(), scheduleType: SCHEDULE_WEEKLY, daysOfWeek: [1, 3, 5] };
    expect(Stats.scheduleLabel(h)).toBe("Mon, Wed, Fri");
  });
  it("avoid daily for negative", () => {
    expect(Stats.scheduleLabel({ ...defaultHabit(), negative: true })).toBe("Avoid daily");
  });
});
