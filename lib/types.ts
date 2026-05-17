export type Group = {
  id: string;
  code: string;
  name: string;
  created_at: string;
};

export type Student = {
  id: string;
  group_id: string;
  display_name: string;
  created_at: string;
};

export type Entry = {
  id: string;
  student_id: string;
  entry_date: string;
  fajr: boolean;
  fajr_cemaat: boolean;
  dhuhr: boolean;
  dhuhr_cemaat: boolean;
  asr: boolean;
  asr_cemaat: boolean;
  maghrib: boolean;
  maghrib_cemaat: boolean;
  isha: boolean;
  isha_cemaat: boolean;
  tahajjud: boolean;
  duha: boolean;
  evvabin: boolean;
  quran_pages: number;
  zikr_count: number;
  book_pages: number;
  updated_at: string;
};

export type Contest = {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  scoring: Record<HabitKey, number>;
  created_at: string;
};

export const PRAYER_KEYS = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

export const OPTIONAL_PRAYER_KEYS = ["tahajjud", "duha", "evvabin"] as const;
export type OptionalPrayerKey = (typeof OPTIONAL_PRAYER_KEYS)[number];

export const COUNT_KEYS = ["quran_pages", "zikr_count", "book_pages"] as const;
export type CountKey = (typeof COUNT_KEYS)[number];

export type CemaatKey =
  | "fajr_cemaat"
  | "dhuhr_cemaat"
  | "asr_cemaat"
  | "maghrib_cemaat"
  | "isha_cemaat";

export type HabitKey = PrayerKey | OptionalPrayerKey | CountKey | CemaatKey;

export const ALL_HABIT_KEYS: HabitKey[] = [
  "fajr",
  "fajr_cemaat",
  "dhuhr",
  "dhuhr_cemaat",
  "asr",
  "asr_cemaat",
  "maghrib",
  "maghrib_cemaat",
  "isha",
  "isha_cemaat",
  "tahajjud",
  "duha",
  "evvabin",
  "quran_pages",
  "zikr_count",
  "book_pages",
];

export const HABIT_LABELS: Record<HabitKey, string> = {
  fajr: "Fajr",
  fajr_cemaat: "Fajr (cemaat)",
  dhuhr: "Dhuhr",
  dhuhr_cemaat: "Dhuhr (cemaat)",
  asr: "Asr",
  asr_cemaat: "Asr (cemaat)",
  maghrib: "Maghrib",
  maghrib_cemaat: "Maghrib (cemaat)",
  isha: "Isha",
  isha_cemaat: "Isha (cemaat)",
  tahajjud: "Tahajjud",
  duha: "Duha",
  evvabin: "Evvabin",
  quran_pages: "Quran (pages)",
  zikr_count: "Zikr (count)",
  book_pages: "Book (pages)",
};

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const OPTIONAL_PRAYER_LABELS: Record<OptionalPrayerKey, string> = {
  tahajjud: "Tahajjud",
  duha: "Duha",
  evvabin: "Evvabin",
};

export const DEFAULT_SCORING: Record<HabitKey, number> = {
  fajr: 5,
  fajr_cemaat: 5,
  dhuhr: 5,
  dhuhr_cemaat: 5,
  asr: 5,
  asr_cemaat: 5,
  maghrib: 5,
  maghrib_cemaat: 5,
  isha: 5,
  isha_cemaat: 5,
  tahajjud: 10,
  duha: 5,
  evvabin: 5,
  quran_pages: 1,
  zikr_count: 0,
  book_pages: 1,
};
