"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Trash2,
  Home,
  Trophy,
  Target,
  BookOpen,
  Sparkles,
  Moon,
} from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { TabBar } from "@/components/TabBar";
import { Button } from "@/components/Button";
import { formatDate } from "@/lib/date-format";
import {
  HABIT_LABELS,
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

const HABIT_GROUPS: Array<{
  title: string;
  keys: MentorToggleHabitKey[];
}> = [
  {
    title: "Cemaat",
    keys: [
      "fajr_cemaat",
      "dhuhr_cemaat",
      "asr_cemaat",
      "maghrib_cemaat",
      "isha_cemaat",
    ],
  },
  {
    title: "Sunnah and reading",
    keys: [
      "tahajjud",
      "duha",
      "evvabin",
      "cevsen_pages",
      "quran_pages",
      "zikr_count",
      "book_pages",
    ],
  },
];

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [me, setMe] = useState<{ groupName: string } | null>(null);
  const [student, setStudent] = useState<{ display_name: string } | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [habitSettings, setHabitSettings] = useState<HabitSettings>(() =>
    Object.fromEntries(
      MENTOR_TOGGLE_HABIT_KEYS.map((key) => [key, true])
    ) as HabitSettings
  );
  const [savingHabit, setSavingHabit] = useState<MentorToggleHabitKey | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.leader) {
        router.push("/leader");
        return;
      }
      setMe({ groupName: meData.leader.groupName });
      const res = await fetch(`/api/leader/members/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        router.push("/leader/dashboard");
        return;
      }
      setStudent(data.student);
      setEntries(data.entries);
      if (data.habitSettings) {
        setHabitSettings(data.habitSettings);
      }
      setLoading(false);
    })();
  }, [params.id, router]);

  async function setHabit(key: MentorToggleHabitKey, enabled: boolean) {
    const next = { ...habitSettings, [key]: enabled };
    setHabitSettings(next);
    setSavingHabit(key);
    const res = await fetch(`/api/leader/members/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitSettings: next }),
    });
    const data = await res.json();
    if (res.ok && data.habitSettings) {
      setHabitSettings(data.habitSettings);
    }
    setSavingHabit(null);
  }

  async function onRemove() {
    if (!confirm("Remove this student? Their data will be deleted.")) return;
    await fetch(`/api/leader/members/${params.id}`, { method: "DELETE" });
    router.push("/leader/dashboard");
  }

  const tabs = [
    { href: "/leader/dashboard", label: "Members", icon: <Home size={16} /> },
    { href: "/leader/goals", label: "Goals", icon: <Target size={16} /> },
    { href: "/leader/contests", label: "Contests", icon: <Trophy size={16} /> },
    { href: "/leader/reports", label: "Reports", icon: <Calendar size={16} /> },
  ];

  if (loading || !student) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-mocha-500 animate-pulse">Loading…</div>
      </main>
    );
  }

  const totals = entries.reduce(
    (a, e) => {
      a.quran += e.quran_pages;
      a.zikr += e.zikr_count;
      a.book += e.book_pages;
      a.cevsen += e.cevsen_pages || 0;
      a.fajrCemaat += e.fajr_cemaat ? 1 : 0;
      a.tahajjud += e.tahajjud ? 1 : 0;
      return a;
    },
    { quran: 0, zikr: 0, book: 0, cevsen: 0, fajrCemaat: 0, tahajjud: 0 }
  );

  return (
    <main className="min-h-screen pb-28">
      <Header title="Talebe" subtitle={me?.groupName} logoutPath="group" />
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <Link
          href="/leader/dashboard"
          className="tap inline-flex items-center gap-1 text-mocha-500 text-sm mb-4"
        >
          <ArrowLeft size={16} /> Back to members
        </Link>

        <div className="flex items-end justify-between mb-5">
          <h1 className="font-display text-3xl font-semibold text-mocha-700">
            {student.display_name}
          </h1>
          <Button variant="danger" onClick={onRemove}>
            <Trash2 size={16} /> Remove
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <Stat icon={<BookOpen size={14} />} v={totals.quran} l="Quran pages (60d)" />
          <Stat icon={<Sparkles size={14} />} v={totals.zikr} l="Zikr (60d)" />
          <Stat icon={<Moon size={14} />} v={totals.book} l="Book pages (60d)" />
          <Stat icon={<BookOpen size={14} />} v={totals.cevsen} l="Cevsen pages (60d)" />
          <Stat icon={<Moon size={14} />} v={totals.fajrCemaat} l="Fajr cemaat days" />
          <Stat icon={<Moon size={14} />} v={totals.tahajjud} l="Tahajjud days" />
        </div>

        <GlassCard className="p-5 mb-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-mocha-700">
                Student goals
              </h2>
              <p className="text-sm text-mocha-500">
                Turn off goals that should not appear on this student's tracker.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {HABIT_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="text-xs font-medium uppercase tracking-wide text-mocha-400 mb-2">
                  {group.title}
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {group.keys.map((key) => {
                    const enabled = habitSettings[key] !== false;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setHabit(key, !enabled)}
                        className={`tap rounded-2xl px-4 py-3 flex items-center justify-between text-left border transition ${
                          enabled
                            ? "bg-accent-sage/12 border-accent-sage/30"
                            : "bg-cream-100/60 border-cream-300/60"
                        }`}
                      >
                        <span
                          className={`font-medium ${
                            enabled ? "text-mocha-700" : "text-mocha-400"
                          }`}
                        >
                          {HABIT_LABELS[key]}
                        </span>
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            enabled
                              ? "bg-accent-sage text-white"
                              : "bg-cream-200/80 text-mocha-400"
                          }`}
                        >
                          {savingHabit === key ? (
                            <span className="w-3 h-3 rounded-full bg-current animate-pulse" />
                          ) : (
                            enabled && <CheckCircle2 size={16} />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <h2 className="font-display text-lg font-semibold text-mocha-700 mb-2 px-1">
          History (last 60 days)
        </h2>

        {entries.length === 0 ? (
          <GlassCard className="p-8 text-center text-mocha-500">
            No entries yet.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((e) => {
              const prayers = [e.fajr, e.dhuhr, e.asr, e.maghrib, e.isha].filter(
                Boolean
              ).length;
              const cemaat = [
                e.fajr_cemaat,
                e.dhuhr_cemaat,
                e.asr_cemaat,
                e.maghrib_cemaat,
                e.isha_cemaat,
              ].filter(Boolean).length;
              const optional = [e.tahajjud, e.duha, e.evvabin].filter(Boolean)
                .length;
              return (
                <div
                  key={e.entry_date}
                  className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="text-sm font-medium text-mocha-700 tabular-nums min-w-28">
                    {formatDate(e.entry_date)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-mocha-500">
                    <Pill>Prayers {prayers}/5</Pill>
                    <Pill>Cemaat {cemaat}</Pill>
                    <Pill>Sunnah {optional}</Pill>
                    <Pill>Quran {e.quran_pages}</Pill>
                    <Pill>Zikr {e.zikr_count}</Pill>
                    <Pill>Cevsen {e.cevsen_pages || 0}</Pill>
                    <Pill>Book {e.book_pages}</Pill>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <TabBar tabs={tabs} />
    </main>
  );
}

function Stat({
  icon,
  v,
  l,
}: {
  icon: React.ReactNode;
  v: number;
  l: string;
}) {
  return (
    <GlassCard className="p-3">
      <div className="flex items-center gap-1.5 text-mocha-400 text-xs">
        {icon}
        {l}
      </div>
      <div className="font-display text-2xl font-semibold text-mocha-700 tabular-nums mt-1">
        {v}
      </div>
    </GlassCard>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-cream-200/80 rounded-full px-2.5 py-1">{children}</span>
  );
}
