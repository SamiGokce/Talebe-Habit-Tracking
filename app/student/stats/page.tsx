"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Flame,
  Trophy,
  Calendar,
  Home,
  Sparkles,
  Moon,
} from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { TabBar } from "@/components/TabBar";
import { formatDate } from "@/lib/date-format";
import {
  MENTOR_TOGGLE_HABIT_KEYS,
  type MentorToggleHabitKey,
} from "@/lib/types";

type Entry = {
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
  cevsen: boolean;
  cevsen_pages: number;
  quran_pages: number;
  zikr_count: number;
  book_pages: number;
};

type HabitSettings = Record<MentorToggleHabitKey, boolean>;

function streakOf(entries: Entry[], pred: (e: Entry) => boolean): {
  current: number;
  longest: number;
} {
  if (entries.length === 0) return { current: 0, longest: 0 };
  const byDate = new Map(entries.map((e) => [e.entry_date, e]));
  // sort dates desc
  const dates = Array.from(byDate.keys()).sort((a, b) => (a < b ? 1 : -1));

  // current streak: starting from today (or yesterday), count consecutive met days
  let current = 0;
  const today = new Date();
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const e = byDate.get(iso);
    if (e && pred(e)) current++;
    else break;
  }

  let longest = 0;
  let run = 0;
  // walk chronologically
  const chrono = [...dates].sort();
  for (let i = 0; i < chrono.length; i++) {
    const iso = chrono[i];
    const e = byDate.get(iso)!;
    if (!pred(e)) {
      run = 0;
      continue;
    }
    if (i > 0) {
      const prev = chrono[i - 1];
      const diff =
        (new Date(iso).getTime() - new Date(prev).getTime()) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }
  return { current, longest: Math.max(longest, current) };
}

export default function StatsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [me, setMe] = useState<{ displayName: string } | null>(null);
  const [habitSettings, setHabitSettings] = useState<HabitSettings>(() =>
    Object.fromEntries(
      MENTOR_TOGGLE_HABIT_KEYS.map((key) => [key, true])
    ) as HabitSettings
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.student) {
        router.push("/student/join");
        return;
      }
      setMe({ displayName: meData.student.displayName });
      const res = await fetch("/api/entries/history?days=60");
      const data = await res.json();
      setEntries(data.entries || []);
      if (data.habitSettings) {
        setHabitSettings(data.habitSettings);
      }
      setLoading(false);
    })();
  }, [router]);

  function isHabitEnabled(key: MentorToggleHabitKey) {
    return habitSettings[key] !== false;
  }

  const streaks = useMemo(() => {
    const all5 = streakOf(entries, (e) =>
      Boolean(e.fajr && e.dhuhr && e.asr && e.maghrib && e.isha)
    );
    const fajr = streakOf(entries, (e) => e.fajr);
    const fajrCemaat = streakOf(entries, (e) => e.fajr_cemaat);
    const tahajjud = streakOf(entries, (e) => e.tahajjud);
    const quran = streakOf(entries, (e) => e.quran_pages > 0);
    return { all5, fajr, fajrCemaat, tahajjud, quran };
  }, [entries]);

  const totals = useMemo(() => {
    let pages = 0;
    let zikr = 0;
    let book = 0;
    let cevsen = 0;
    for (const e of entries) {
      pages += e.quran_pages;
      zikr += e.zikr_count;
      book += e.book_pages;
      cevsen += e.cevsen_pages || 0;
    }
    return { pages, zikr, book, cevsen };
  }, [entries]);

  const last30 = useMemo(() => {
    // build a grid of last 30 days, oldest left, newest right
    const today = new Date();
    const out: { iso: string; entry?: Entry }[] = [];
    const map = new Map(entries.map((e) => [e.entry_date, e]));
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      out.push({ iso, entry: map.get(iso) });
    }
    return out;
  }, [entries]);

  const tabs = [
    { href: "/student/today", label: "Today", icon: <Home size={16} /> },
    { href: "/student/stats", label: "Stats", icon: <Calendar size={16} /> },
    {
      href: "/student/contests",
      label: "Contests",
      icon: <Trophy size={16} />,
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-mocha-500 animate-pulse">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-28">
      <Header title="Talebe" subtitle={me?.displayName} logoutPath="student" />
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <h1 className="font-display text-3xl font-semibold text-mocha-700 mb-5">
          Your stats
        </h1>

        <GlassCard className="p-5 mb-5 animate-slide-up">
          <div className="flex items-center gap-2 text-mocha-500 text-sm mb-3">
            <Flame size={16} className="text-accent-gold" /> Current streaks
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StreakCard label="All 5 prayers" v={streaks.all5} />
            <StreakCard label="Fajr" v={streaks.fajr} />
            {isHabitEnabled("fajr_cemaat") && (
              <StreakCard label="Fajr cemaat" v={streaks.fajrCemaat} />
            )}
            {isHabitEnabled("tahajjud") && (
              <StreakCard label="Tahajjud" v={streaks.tahajjud} />
            )}
            {isHabitEnabled("quran_pages") && (
              <StreakCard label="Quran daily" v={streaks.quran} />
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5 mb-5 animate-slide-up">
          <div className="flex items-center gap-2 text-mocha-500 text-sm mb-3">
            <BookOpen size={16} /> Last 60 days
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            {isHabitEnabled("quran_pages") && (
              <BigStat
                icon={<BookOpen size={16} />}
                value={totals.pages}
                label="Quran pages"
              />
            )}
            {isHabitEnabled("zikr_count") && (
              <BigStat
                icon={<Sparkles size={16} />}
                value={totals.zikr}
                label="Zikr count"
              />
            )}
            {isHabitEnabled("book_pages") && (
              <BigStat
                icon={<Moon size={16} />}
                value={totals.book}
                label="Book pages"
              />
            )}
            {isHabitEnabled("cevsen_pages") && (
              <BigStat
                icon={<BookOpen size={16} />}
                value={totals.cevsen}
                label="Cevsen pages"
              />
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5 mb-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-mocha-500 text-sm">
              <Calendar size={16} /> Last 30 days
            </div>
            <div className="flex items-center gap-2 text-xs text-mocha-400">
              <span className="inline-block w-3 h-3 rounded-sm bg-accent-sage/30" />
              <span>some</span>
              <span className="inline-block w-3 h-3 rounded-sm bg-accent-sage" />
              <span>all 5</span>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] sm:grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
            {last30.map(({ iso, entry }) => {
              const count = entry
                ? [
                    entry.fajr,
                    entry.dhuhr,
                    entry.asr,
                    entry.maghrib,
                    entry.isha,
                  ].filter(Boolean).length
                : 0;
              const bg = !entry
                ? "bg-cream-200/70"
                : count === 5
                  ? "bg-accent-sage"
                  : count === 0
                    ? "bg-cream-300/80"
                    : count >= 4
                      ? "bg-accent-sage/70"
                      : count >= 2
                        ? "bg-accent-sage/40"
                        : "bg-accent-sage/20";
              return (
                <div
                  key={iso}
                  title={`${formatDate(iso)} · ${count}/5 prayers`}
                  className={`aspect-square rounded ${bg}`}
                />
              );
            })}
          </div>
        </GlassCard>
      </div>
      <TabBar tabs={tabs} />
    </main>
  );
}

function StreakCard({
  label,
  v,
}: {
  label: string;
  v: { current: number; longest: number };
}) {
  return (
    <div className="glass-soft rounded-2xl px-3 py-3">
      <div className="text-xs text-mocha-400">{label}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <div className="font-display text-2xl font-semibold text-mocha-700 tabular-nums">
          {v.current}
        </div>
        <div className="text-xs text-mocha-400">/ best {v.longest}</div>
      </div>
    </div>
  );
}

function BigStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-mocha-400">{icon}</div>
      <div className="font-display text-2xl font-semibold text-mocha-700 tabular-nums">
        {value}
      </div>
      <div className="text-xs text-mocha-400">{label}</div>
    </div>
  );
}
