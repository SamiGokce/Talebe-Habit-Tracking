"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Book,
  Moon,
  Sun,
  Sparkles,
  Sunrise,
  CheckCircle2,
  Calendar,
  Trophy,
  Home,
} from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { PrayerRow } from "@/components/PrayerRow";
import { HabitToggle } from "@/components/HabitToggle";
import { Stepper } from "@/components/Stepper";
import { TabBar } from "@/components/TabBar";

type EntryState = {
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
};

type Me = {
  student: { studentId: string; displayName: string; groupCode: string } | null;
};

const PRAYERS = [
  { key: "fajr", label: "Fajr" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
] as const;

export default function TodayPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me["student"] | null>(null);
  const [entry, setEntry] = useState<EntryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.student) {
        router.push("/student/join");
        return;
      }
      setMe(meData.student);

      const res = await fetch("/api/entries");
      const data = await res.json();
      setEntry(data.entry);
      setLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    if (!entry || initialLoad.current) {
      if (entry) initialLoad.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      const res = await fetch("/api/entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1400);
      } else {
        setSaveState("idle");
      }
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [entry]);

  const set = <K extends keyof EntryState>(key: K, value: EntryState[K]) => {
    setEntry((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const togglePrayer = (key: (typeof PRAYERS)[number]["key"]) => {
    if (!entry) return;
    const next = !entry[key];
    setEntry({
      ...entry,
      [key]: next,
      [`${key}_cemaat`]: next ? entry[`${key}_cemaat` as keyof EntryState] : false,
    } as EntryState);
  };

  const toggleCemaat = (key: (typeof PRAYERS)[number]["key"]) => {
    if (!entry) return;
    const cemaatKey = `${key}_cemaat` as keyof EntryState;
    const cemaatVal = !entry[cemaatKey];
    setEntry({
      ...entry,
      [cemaatKey]: cemaatVal,
      [key]: cemaatVal ? true : entry[key],
    } as EntryState);
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "As-salamu alaykum";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 20) return "Good evening";
    return "Good night";
  }, []);

  const summary = useMemo(() => {
    if (!entry) return { prayers: 0, cemaat: 0, optional: 0 };
    const prayers = PRAYERS.filter((p) => entry[p.key]).length;
    const cemaat = PRAYERS.filter(
      (p) => entry[`${p.key}_cemaat` as keyof EntryState]
    ).length;
    const optional = [entry.tahajjud, entry.duha, entry.evvabin].filter(
      Boolean
    ).length;
    return { prayers, cemaat, optional };
  }, [entry]);

  const tabs = [
    { href: "/student/today", label: "Today", icon: <Home size={16} /> },
    { href: "/student/stats", label: "Stats", icon: <Calendar size={16} /> },
    {
      href: "/student/contests",
      label: "Contests",
      icon: <Trophy size={16} />,
    },
  ];

  if (loading || !entry || !me) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-mocha-500 animate-pulse">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-28">
      <Header
        title="Talebe"
        subtitle={me.displayName}
        logoutPath="student"
        right={
          <span
            className={`text-xs px-2.5 py-1 rounded-full transition ${
              saveState === "saving"
                ? "bg-cream-200 text-mocha-500"
                : saveState === "saved"
                  ? "bg-accent-sage/20 text-accent-sage"
                  : "opacity-0"
            }`}
          >
            {saveState === "saving" ? "Saving…" : "Saved"}
          </span>
        }
      />

      <div className="max-w-2xl mx-auto px-4 pt-2">
        <div className="mb-5 animate-fade-in">
          <div className="text-mocha-400 text-sm">{greeting},</div>
          <h1 className="font-display text-3xl font-semibold text-mocha-700">
            {me.displayName.split(" ")[0]}
          </h1>
          <div className="mt-1 text-mocha-500 text-sm">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Summary */}
        <GlassCard className="p-5 mb-5 animate-slide-up">
          <div className="grid grid-cols-3 gap-3 text-center">
            <SummaryStat
              icon={<Moon size={16} />}
              value={`${summary.prayers}/5`}
              label="Prayers"
            />
            <SummaryStat
              icon={<Sparkles size={16} />}
              value={String(summary.cemaat)}
              label="Cemaat"
            />
            <SummaryStat
              icon={<CheckCircle2 size={16} />}
              value={String(summary.optional)}
              label="Sunnah"
            />
          </div>
        </GlassCard>

        {/* Prayers */}
        <Section title="The five prayers" hint="Tap to mark missed">
          <div className="flex flex-col gap-2">
            {PRAYERS.map((p) => (
              <PrayerRow
                key={p.key}
                label={p.label}
                done={entry[p.key]}
                cemaat={entry[`${p.key}_cemaat` as keyof EntryState] as boolean}
                onToggleDone={() => togglePrayer(p.key)}
                onToggleCemaat={() => toggleCemaat(p.key)}
              />
            ))}
          </div>
        </Section>

        {/* Optional prayers */}
        <Section title="Sunnah & nafl">
          <div className="grid sm:grid-cols-3 gap-2">
            <HabitToggle
              label="Tahajjud"
              icon={<Moon size={16} />}
              done={entry.tahajjud}
              onToggle={() => set("tahajjud", !entry.tahajjud)}
            />
            <HabitToggle
              label="Duha"
              icon={<Sun size={16} />}
              done={entry.duha}
              onToggle={() => set("duha", !entry.duha)}
            />
            <HabitToggle
              label="Evvabin"
              icon={<Sunrise size={16} />}
              done={entry.evvabin}
              onToggle={() => set("evvabin", !entry.evvabin)}
            />
          </div>
        </Section>

        {/* Counts */}
        <Section title="Quran, zikr & reading">
          <div className="flex flex-col gap-2">
            <Stepper
              label="Quran"
              hint="pages today"
              value={entry.quran_pages}
              onChange={(n) => set("quran_pages", n)}
              icon={<BookOpen size={18} />}
              unit="pages"
            />
            <Stepper
              label="Zikr"
              hint="count"
              value={entry.zikr_count}
              onChange={(n) => set("zikr_count", n)}
              step={10}
              icon={<Sparkles size={18} />}
            />
            <Stepper
              label="Book reading"
              hint="pages today"
              value={entry.book_pages}
              onChange={(n) => set("book_pages", n)}
              icon={<Book size={18} />}
              unit="pages"
            />
          </div>
        </Section>
      </div>

      <TabBar tabs={tabs} />
    </main>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 animate-slide-up">
      <div className="flex items-end justify-between px-1 mb-2">
        <h2 className="font-display text-lg font-semibold text-mocha-700">
          {title}
        </h2>
        {hint && <span className="text-xs text-mocha-400">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function SummaryStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
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
