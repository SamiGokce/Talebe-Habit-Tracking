import { sql } from "@/lib/db";
import {
  COUNT_KEYS,
  MENTOR_TOGGLE_HABIT_KEYS,
  type MentorToggleHabitKey,
} from "@/lib/types";

export type HabitSettings = Record<MentorToggleHabitKey, boolean>;

export function defaultHabitSettings(): HabitSettings {
  return Object.fromEntries(
    MENTOR_TOGGLE_HABIT_KEYS.map((key) => [key, true])
  ) as HabitSettings;
}

export async function getHabitSettings(studentId: string) {
  const settings = defaultHabitSettings();
  const rows = await sql`
    SELECT habit_key, enabled
    FROM student_habit_settings
    WHERE student_id = ${studentId}
  `;

  for (const row of rows as Array<{ habit_key: string; enabled: boolean }>) {
    if (row.habit_key in settings) {
      settings[row.habit_key as MentorToggleHabitKey] = row.enabled;
    }
  }

  return settings;
}

export function disabledHabitKeys(settings: HabitSettings) {
  return MENTOR_TOGGLE_HABIT_KEYS.filter((key) => !settings[key]);
}

export function isCountHabit(key: MentorToggleHabitKey) {
  return COUNT_KEYS.includes(key as (typeof COUNT_KEYS)[number]);
}
