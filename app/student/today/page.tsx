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
  Plus,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { PrayerRow } from "@/components/PrayerRow";
import { HabitToggle } from "@/components/HabitToggle";
import { Stepper } from "@/components/Stepper";
import { TabBar } from "@/components/TabBar";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { formatDate } from "@/lib/date-format";
import {
  MENTOR_TOGGLE_HABIT_KEYS,
  type MentorToggleHabitKey,
} from "@/lib/types";

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
  cevsen: boolean;
  quran_pages: number;
  zikr_count: number;
  book_pages: number;
};

type Goal = {
  id: string;
  title: string;
  description: string | null;
  kind: "boolean" | "count";
  unit: string | null;
  created_by_role: "talebe" | "mentor" | "uniteci";
  completed: boolean;
  amount: number;
};

type Me = {
  student: { studentId: string; displayName: string; groupCode: string } | null;
};

type HabitSettings = Record<MentorToggleHabitKey, boolean>;

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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habitSettings, setHabitSettings] = useState<HabitSettings>(() =>
    Object.fromEntries(
      MENTOR_TOGGLE_HABIT_KEYS.map((key) => [key, true])
    ) as HabitSettings
  );
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [showGoalForm, setShowGoalForm] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goalSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoad = useRef(true);
  const initialGoalLoad = useRef(true);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.student) {
        router.push("/student/join");
        return;
      }
      setMe(meData.student);

      const [entryRes, goalsRes] = await Promise.all([
        fetch("/api/entries"),
        fetch("/api/goals"),
      ]);
      const entryData = await entryRes.json();
      const goalsData = await goalsRes.json();
      setEntry(entryData.entry);
      if (entryData.habitSettings) {
        setHabitSettings(entryData.habitSettings);
      }
      setGoals(goalsData.goals || []);
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

  useEffect(() => {
    if (!entry?.entry_date) return;
    if (initialGoalLoad.current) {
      initialGoalLoad.current = false;
      return;
    }
    if (goalSaveTimer.current) clearTimeout(goalSaveTimer.current);
    setSaveState("saving");
    goalSaveTimer.current = setTimeout(async () => {
      const res = await fetch("/api/goal-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_date: entry.entry_date,
          goals: goals.map((g) => ({
            goal_id: g.id,
            completed: g.completed,
            amount: g.amount,
          })),
        }),
      });
      if (res.ok) {
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1400);
      } else {
        setSaveState("idle");
      }
    }, 600);
    return () => {
      if (goalSaveTimer.current) clearTimeout(goalSaveTimer.current);
    };
  }, [goals, entry?.entry_date]);

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
    if (!isHabitEnabled(cemaatKey as MentorToggleHabitKey)) return;
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
      (p) =>
        isHabitEnabled(`${p.key}_cemaat` as MentorToggleHabitKey) &&
        entry[`${p.key}_cemaat` as keyof EntryState]
    ).length;
    const optional = (
      [
        ["tahajjud", entry.tahajjud],
        ["duha", entry.duha],
        ["evvabin", entry.evvabin],
        ["cevsen", entry.cevsen],
      ] as const
    ).filter(([key, value]) => isHabitEnabled(key) && value).length;
    return { prayers, cemaat, optional };
  }, [entry, habitSettings]);

  function isHabitEnabled(key: MentorToggleHabitKey) {
    return habitSettings[key] !== false;
  }

  const updateGoal = (id: string, patch: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...patch } : g))
    );
  };

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
            {formatDate(new Date().toISOString())}
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
                showCemaat={isHabitEnabled(`${p.key}_cemaat` as MentorToggleHabitKey)}
              />
            ))}
          </div>
        </Section>

        {/* Optional prayers */}
        {(isHabitEnabled("tahajjud") ||
          isHabitEnabled("duha") ||
          isHabitEnabled("evvabin")) && (
        <Section title="Sunnah & nafl">
          <div className="grid sm:grid-cols-3 gap-2">
            {isHabitEnabled("tahajjud") && (
              <HabitToggle
                label="Tahajjud"
                icon={<Moon size={16} />}
                done={entry.tahajjud}
                onToggle={() => set("tahajjud", !entry.tahajjud)}
              />
            )}
            {isHabitEnabled("duha") && (
              <HabitToggle
                label="Duha"
                icon={<Sun size={16} />}
                done={entry.duha}
                onToggle={() => set("duha", !entry.duha)}
              />
            )}
            {isHabitEnabled("evvabin") && (
              <HabitToggle
                label="Evvabin"
                icon={<Sunrise size={16} />}
                done={entry.evvabin}
                onToggle={() => set("evvabin", !entry.evvabin)}
              />
            )}
          </div>
        </Section>
        )}

        {/* Counts */}
        {(isHabitEnabled("quran_pages") ||
          isHabitEnabled("zikr_count") ||
          isHabitEnabled("book_pages") ||
          isHabitEnabled("cevsen")) && (
        <Section title="Quran, zikr & reading">
          <div className="flex flex-col gap-2">
            {isHabitEnabled("quran_pages") && (
              <Stepper
                label="Quran"
                hint="pages today"
                value={entry.quran_pages}
                onChange={(n) => set("quran_pages", n)}
                icon={<BookOpen size={18} />}
                unit="pages"
              />
            )}
            {isHabitEnabled("zikr_count") && (
              <Stepper
                label="Zikr"
                hint="count"
                value={entry.zikr_count}
                onChange={(n) => set("zikr_count", n)}
                step={10}
                icon={<Sparkles size={18} />}
              />
            )}
            {isHabitEnabled("book_pages") && (
              <Stepper
                label="Book reading"
                hint="pages today"
                value={entry.book_pages}
                onChange={(n) => set("book_pages", n)}
                icon={<Book size={18} />}
                unit="pages"
              />
            )}
            {isHabitEnabled("cevsen") && (
              <HabitToggle
                label="Cevsen reading"
                icon={<Book size={16} />}
                done={entry.cevsen}
                onToggle={() => set("cevsen", !entry.cevsen)}
              />
            )}
          </div>
        </Section>
        )}

        <Section
          title="Custom goals"
          action={
            <button
              onClick={() => setShowGoalForm(true)}
              className="tap w-8 h-8 rounded-full glass-soft text-mocha-600 flex items-center justify-center"
              aria-label="Create personal goal"
            >
              <Plus size={16} />
            </button>
          }
        >
          {goals.length === 0 ? (
            <GlassCard className="p-5 text-sm text-mocha-500">
              No custom goals yet.
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-2">
              {goals.map((g) =>
                g.kind === "count" ? (
                  <Stepper
                    key={g.id}
                    label={g.title}
                    hint={
                      g.created_by_role === "talebe"
                        ? "Personal goal"
                        : "Assigned goal"
                    }
                    value={g.amount}
                    onChange={(n) =>
                      updateGoal(g.id, { amount: n, completed: n > 0 })
                    }
                    icon={<Sparkles size={18} />}
                    unit={g.unit || undefined}
                  />
                ) : (
                  <HabitToggle
                    key={g.id}
                    label={g.title}
                    hint={
                      g.created_by_role === "talebe"
                        ? "Personal goal"
                        : "Assigned goal"
                    }
                    done={g.completed}
                    onToggle={() =>
                      updateGoal(g.id, { completed: !g.completed })
                    }
                    icon={<Sparkles size={16} />}
                  />
                )
              )}
            </div>
          )}
        </Section>
      </div>

      <TabBar tabs={tabs} />
      {showGoalForm && (
        <NewPersonalGoalModal
          onClose={() => setShowGoalForm(false)}
          onCreated={(goal) => {
            setGoals((prev) => [
              ...prev,
              { ...goal, completed: false, amount: 0 },
            ]);
            setShowGoalForm(false);
          }}
        />
      )}
    </main>
  );
}

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 animate-slide-up">
      <div className="flex items-end justify-between px-1 mb-2">
        <h2 className="font-display text-lg font-semibold text-mocha-700">
          {title}
        </h2>
        {action ?? (hint && <span className="text-xs text-mocha-400">{hint}</span>)}
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

function NewPersonalGoalModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (goal: Goal) => void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"boolean" | "count">("boolean");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        kind,
        unit,
        points: 1,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create goal.");
      setLoading(false);
      return;
    }
    onCreated(data.goal);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-mocha-800/30 backdrop-blur-sm animate-fade-in">
      <div className="glass-strong rounded-3xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold text-mocha-700">
            Personal goal
          </h2>
          <button
            onClick={onClose}
            className="tap p-2 rounded-full hover:bg-cream-200/60 text-mocha-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input
            label="Goal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Memorize a dua"
            required
          />
          <div>
            <div className="text-sm font-medium text-mocha-600 mb-1.5">
              Tracking style
            </div>
            <div className="glass-soft rounded-2xl p-1 flex">
              {(["boolean", "count"] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKind(k)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium tap transition ${
                    kind === k ? "bg-mocha-600 text-cream-50" : "text-mocha-500"
                  }`}
                >
                  {k === "boolean" ? "Done" : "Count"}
                </button>
              ))}
            </div>
          </div>
          {kind === "count" && (
            <Input
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="pages, minutes, times"
            />
          )}
          {error && (
            <div className="text-sm text-accent-rose bg-accent-rose/10 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose} block>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} block>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
