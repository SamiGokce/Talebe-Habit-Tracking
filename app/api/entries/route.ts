import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { todayISO } from "@/lib/codes";
import { disabledHabitKeys, getHabitSettings, isCountHabit } from "@/lib/habit-settings";
import {
  ALL_HABIT_KEYS,
  COUNT_KEYS,
  type HabitKey,
} from "@/lib/types";

export const runtime = "nodejs";

const BOOLEAN_KEYS = ALL_HABIT_KEYS.filter(
  (k) => !COUNT_KEYS.includes(k as (typeof COUNT_KEYS)[number])
) as HabitKey[];

function emptyEntry(date: string) {
  // Smart defaults: 5 daily prayers true, cemaat false, optionals false, counts 0
  return {
    entry_date: date,
    fajr: true,
    fajr_cemaat: false,
    dhuhr: true,
    dhuhr_cemaat: false,
    asr: true,
    asr_cemaat: false,
    maghrib: true,
    maghrib_cemaat: false,
    isha: true,
    isha_cemaat: false,
    tahajjud: false,
    duha: false,
    evvabin: false,
    cevsen: false,
    quran_pages: 0,
    zikr_count: 0,
    book_pages: 0,
  };
}

export async function GET(req: Request) {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? todayISO();
  const habitSettings = await getHabitSettings(session.studentId);
  const disabled = disabledHabitKeys(habitSettings);

  const rows = await sql`
    SELECT * FROM entries
    WHERE student_id = ${session.studentId} AND entry_date = ${date}
  `;
  if (rows.length === 0) {
    return NextResponse.json({
      entry: emptyEntry(date),
      persisted: false,
      habitSettings,
      disabledHabitKeys: disabled,
    });
  }
  return NextResponse.json({
    entry: rows[0],
    persisted: true,
    habitSettings,
    disabledHabitKeys: disabled,
  });
}

export async function PUT(req: Request) {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const body = await req.json();
  const date = String(body.entry_date ?? todayISO());

  // sanitize input
  const bools: Record<string, boolean> = {};
  for (const k of BOOLEAN_KEYS) {
    bools[k] = Boolean(body[k]);
  }
  // cemaat implies the prayer was performed
  if (bools.fajr_cemaat) bools.fajr = true;
  if (bools.dhuhr_cemaat) bools.dhuhr = true;
  if (bools.asr_cemaat) bools.asr = true;
  if (bools.maghrib_cemaat) bools.maghrib = true;
  if (bools.isha_cemaat) bools.isha = true;

  const counts: Record<string, number> = {};
  for (const k of COUNT_KEYS) {
    const v = Number(body[k] ?? 0);
    counts[k] = Number.isFinite(v) && v >= 0 ? Math.min(9999, Math.floor(v)) : 0;
  }

  const habitSettings = await getHabitSettings(session.studentId);
  for (const key of disabledHabitKeys(habitSettings)) {
    if (isCountHabit(key)) {
      counts[key] = 0;
    } else {
      bools[key] = false;
    }
  }

  const rows = await sql`
    INSERT INTO entries (
      student_id, entry_date,
      fajr, fajr_cemaat, dhuhr, dhuhr_cemaat,
      asr, asr_cemaat, maghrib, maghrib_cemaat,
      isha, isha_cemaat,
      tahajjud, duha, evvabin, cevsen,
      quran_pages, zikr_count, book_pages
    ) VALUES (
      ${session.studentId}, ${date},
      ${bools.fajr}, ${bools.fajr_cemaat}, ${bools.dhuhr}, ${bools.dhuhr_cemaat},
      ${bools.asr}, ${bools.asr_cemaat}, ${bools.maghrib}, ${bools.maghrib_cemaat},
      ${bools.isha}, ${bools.isha_cemaat},
      ${bools.tahajjud}, ${bools.duha}, ${bools.evvabin}, ${bools.cevsen},
      ${counts.quran_pages}, ${counts.zikr_count}, ${counts.book_pages}
    )
    ON CONFLICT (student_id, entry_date) DO UPDATE SET
      fajr = EXCLUDED.fajr, fajr_cemaat = EXCLUDED.fajr_cemaat,
      dhuhr = EXCLUDED.dhuhr, dhuhr_cemaat = EXCLUDED.dhuhr_cemaat,
      asr = EXCLUDED.asr, asr_cemaat = EXCLUDED.asr_cemaat,
      maghrib = EXCLUDED.maghrib, maghrib_cemaat = EXCLUDED.maghrib_cemaat,
      isha = EXCLUDED.isha, isha_cemaat = EXCLUDED.isha_cemaat,
      tahajjud = EXCLUDED.tahajjud, duha = EXCLUDED.duha,
      evvabin = EXCLUDED.evvabin, cevsen = EXCLUDED.cevsen,
      quran_pages = EXCLUDED.quran_pages,
      zikr_count = EXCLUDED.zikr_count,
      book_pages = EXCLUDED.book_pages,
      updated_at = NOW()
    RETURNING *
  `;
  return NextResponse.json({ entry: rows[0], ok: true });
}
