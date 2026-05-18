import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getLeaderSession } from "@/lib/session";

export const runtime = "nodejs";

type EntryRow = {
  entry_date: string;
  student_id: string;
  quran_pages: number;
  zikr_count: number;
  book_pages: number;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  fajr_cemaat: boolean;
  dhuhr_cemaat: boolean;
  asr_cemaat: boolean;
  maghrib_cemaat: boolean;
  isha_cemaat: boolean;
};

function average(rows: EntryRow[], value: (row: EntryRow) => number) {
  if (rows.length === 0) return 0;
  return rows.reduce((sum, row) => sum + value(row), 0) / rows.length;
}

function splitTrend(rows: EntryRow[], days: number, value: (row: EntryRow) => number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Math.floor(days / 2));
  const older = rows.filter((row) => new Date(row.entry_date) < cutoff);
  const recent = rows.filter((row) => new Date(row.entry_date) >= cutoff);
  return {
    older: average(older, value),
    recent: average(recent, value),
  };
}

function sentence(label: string, older: number, recent: number) {
  if (older === 0 && recent === 0) return `${label} has not started yet.`;
  if (older === 0 && recent > 0) return `${label} started improving recently.`;
  const ratio = recent / older;
  if (ratio < 0.85) return `${label} decreased over the recent period.`;
  if (ratio > 1.15) return `${label} improved over the recent period.`;
  return `${label} stayed mostly steady.`;
}

export async function GET(req: Request) {
  const session = await getLeaderSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dayInput = Number(url.searchParams.get("days") ?? 30);
  const days = Number.isFinite(dayInput)
    ? Math.floor(Math.min(180, Math.max(7, dayInput)))
    : 30;

  const members = await sql`
    SELECT COUNT(*)::int AS count
    FROM students
    WHERE group_id = ${session.groupId}
  `;
  const entries = (await sql`
    SELECT e.*
    FROM entries e
    JOIN students s ON s.id = e.student_id
    WHERE s.group_id = ${session.groupId}
      AND e.entry_date >= CURRENT_DATE - (${days}::int - 1)
    ORDER BY e.entry_date ASC
  `) as EntryRow[];

  const activeStudents = new Set(entries.map((row) => row.student_id)).size;
  const all5Average = average(entries, (row) =>
    row.fajr && row.dhuhr && row.asr && row.maghrib && row.isha ? 1 : 0
  );
  const cemaatAverage = average(entries, (row) =>
    [
      row.fajr_cemaat,
      row.dhuhr_cemaat,
      row.asr_cemaat,
      row.maghrib_cemaat,
      row.isha_cemaat,
    ].filter(Boolean).length
  );

  const totals = entries.reduce(
    (acc, row) => {
      acc.quran_pages += Number(row.quran_pages || 0);
      acc.zikr_count += Number(row.zikr_count || 0);
      acc.book_pages += Number(row.book_pages || 0);
      return acc;
    },
    { quran_pages: 0, zikr_count: 0, book_pages: 0 }
  );

  const quranTrend = splitTrend(entries, days, (row) => Number(row.quran_pages || 0));
  const cemaatTrend = splitTrend(entries, days, (row) =>
    [
      row.fajr_cemaat,
      row.dhuhr_cemaat,
      row.asr_cemaat,
      row.maghrib_cemaat,
      row.isha_cemaat,
    ].filter(Boolean).length
  );
  const readingTrend = splitTrend(entries, days, (row) =>
    Number(row.book_pages || 0)
  );

  return NextResponse.json({
    days,
    totals,
    members: Number((members[0] as { count: number }).count || 0),
    activeStudents,
    loggedDays: entries.length,
    all5Rate: Math.round(all5Average * 100),
    cemaatAverage: Number(cemaatAverage.toFixed(1)),
    insights: [
      sentence("Quran consistency", quranTrend.older, quranTrend.recent),
      sentence("Cemaat participation", cemaatTrend.older, cemaatTrend.recent),
      sentence("Reading habits", readingTrend.older, readingTrend.recent),
    ],
    trends: {
      quran: quranTrend,
      cemaat: cemaatTrend,
      reading: readingTrend,
    },
  });
}
