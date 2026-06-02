import {
  Target,
  Droplet,
  Leaf,
  Dumbbell,
  Book,
  Brain,
  Sun,
  Moon,
  Heart,
  Flame,
  Coffee,
  Bell,
  Pencil,
  Footprints,
  Bike,
  Timer,
  BedDouble,
  Utensils,
  Pill,
  IndianRupee,
  Code,
  Music,
  Star,
  Globe,
  SmartphoneNfc,
  Ban,
  Wine,
  type LucideIcon,
} from "lucide-react";

/**
 * Catalogue mirrored from the native apps (`Constants.swift` / `Constants.kt`).
 * The `key` is what's persisted on `Habit.emoji` — it must stay byte-identical
 * to the native keys so a habit created on Android/iOS shows the right icon
 * here. Only the rendering differs (native: SF Symbols / vector drawables;
 * web: lucide-react glyphs chosen to match the native intent).
 */
export interface HabitIcon {
  key: string;
  label: string;
  Icon: LucideIcon;
}

export const HABIT_ICONS: HabitIcon[] = [
  { key: "target", label: "Goal", Icon: Target },
  { key: "water", label: "Water", Icon: Droplet },
  { key: "sprout", label: "Grow", Icon: Leaf },
  { key: "dumbbell", label: "Gym", Icon: Dumbbell },
  { key: "book", label: "Read", Icon: Book },
  { key: "meditation", label: "Calm", Icon: Brain },
  { key: "sun", label: "Morning", Icon: Sun },
  { key: "moon", label: "Night", Icon: Moon },
  { key: "heart", label: "Health", Icon: Heart },
  { key: "flame", label: "Streak", Icon: Flame },
  { key: "cup", label: "Coffee", Icon: Coffee },
  { key: "bell", label: "Alarm", Icon: Bell },
  { key: "pencil", label: "Write", Icon: Pencil },
  { key: "walk", label: "Walk", Icon: Footprints },
  { key: "bike", label: "Cycle", Icon: Bike },
  { key: "timer", label: "Focus", Icon: Timer },
  { key: "bed", label: "Sleep", Icon: BedDouble },
  { key: "apple", label: "Eat", Icon: Utensils },
  { key: "pill", label: "Meds", Icon: Pill },
  { key: "money", label: "Money", Icon: IndianRupee },
  { key: "code", label: "Code", Icon: Code },
  { key: "music", label: "Music", Icon: Music },
  { key: "star", label: "Reward", Icon: Star },
  { key: "globe", label: "Learn", Icon: Globe },
  { key: "phone_off", label: "Screen", Icon: SmartphoneNfc },
  { key: "no_smoking", label: "Smoke", Icon: Ban },
  { key: "glass", label: "Alcohol", Icon: Wine },
];

const ICON_BY_KEY: Record<string, LucideIcon> = Object.fromEntries(
  HABIT_ICONS.map((i) => [i.key, i.Icon]),
);

/** lucide icon for a habit icon key, falling back to the default when unknown. */
export function iconFor(key: string | undefined | null): LucideIcon {
  if (!key) return Target;
  return ICON_BY_KEY[key] ?? Target;
}

/** ISO weekday short labels, index 0 = Mon … 6 = Sun. */
export const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
export const DAY_LABELS_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
