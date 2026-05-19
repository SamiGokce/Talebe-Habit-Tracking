"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Moon, Sparkles, Users } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { formatDate } from "@/lib/date-format";

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

type GoalEntry = {
  entry_date: string;
  completed: boolean;
  amount: number;
  title: string;
  kind: "boolean" | "count";
  unit: string | null;
};

type Student = {
  id: string;
  display_name: string;
  group_id: string;
  group_name: string;
  unite_id: string | null;
  unite_name: string | null;
};

export default function PanelStudentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goalEntries, setGoalEntries] = useState<GoalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.account) {
        router.push(`/account?next=/panel/students/${params.id}`);
        return;
      }
      if (!["admin", "uniteci"].includes(meData.account.role)) {
        router.push("/");
        return;
      }

      const res = await fetch(`/api/panel/students/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load student.");
        setLoading(false);
        return;
      }
      setStudent(data.student);
      setEntries(data.entries || []);
      setGoalEntries(data.goalEntries || []);
      setLoading(false);
    })();
  }, [params.id, router]);

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => {
        acc.quran += e.quran_pages || 0;
        acc.zikr += e.zikr_count || 0;
        acc.book += e.book_pages || 0;
        acc.cevsen += e.cevsen_pages || 0;
        acc.all5 += e.fajr && e.dhuhr && e.asr && e.maghrib && e.isha ? 1 : 0;
        acc.cemaat += [
          e.fajr_cemaat,
          e.dhuhr_cemaat,
          e.asr_cemaat,
          e.maghrib_cemaat,
          e.isha_cemaat,
        ].filter(Boolean).length;
        return acc;
      },
      { quran: 0, zikr: 0, book: 0, cevsen: 0, all5: 0, cemaat: 0 }
    );
  }, [entries]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-mocha-500 animate-pulse">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href={student?.group_id ? `/panel/groups/${student.group_id}` : "/panel"}
          className="tap inline-flex items-center gap-1 text-mocha-500 text-sm mb-6"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        {error || !student ? (
          <GlassCard className="p-6 text-mocha-500">
            {error || "Student not found."}
          </GlassCard>
        ) : (
          <>
            <div className="mb-5">
              <h1 className="font-display text-3xl font-semibold text-mocha-700">
                {student.display_name}
              </h1>
              <p className="text-sm text-mocha-500">
                {student.unite_name || "No unite"} / {student.group_name}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-5">
              <Stat icon={<Moon size={14} />} value={totals.all5} label="All 5 days" />
              <Stat icon={<Users size={14} />} value={totals.cemaat} label="Cemaat" />
              <Stat icon={<BookOpen size={14} />} value={totals.quran} label="Quran" />
              <Stat icon={<Sparkles size={14} />} value={totals.zikr} label="Zikr" />
              <Stat icon={<BookOpen size={14} />} value={totals.book} label="Books" />
              <Stat icon={<BookOpen size={14} />} value={totals.cevsen} label="Cevsen" />
            </div>

            <h2 className="font-display text-lg font-semibold text-mocha-700 mb-2 px-1">
              History
            </h2>
            {entries.length === 0 ? (
              <GlassCard className="p-8 text-center text-mocha-500">
                No progress entries yet.
              </GlassCard>
            ) : (
              <div className="flex flex-col gap-2 mb-6">
                {entries.map((e) => {
                  const prayers = [e.fajr, e.dhuhr, e.asr, e.maghrib, e.isha]
                    .filter(Boolean).length;
                  const optional = [e.tahajjud, e.duha, e.evvabin].filter(
                    Boolean
                  ).length;
                  return (
                    <div
                      key={e.entry_date}
                      className="glass rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div className="text-sm font-medium text-mocha-700 tabular-nums">
                        {formatDate(e.entry_date)}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-mocha-500">
                        <Pill>Prayers {prayers}/5</Pill>
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

            {goalEntries.length > 0 && (
              <>
                <h2 className="font-display text-lg font-semibold text-mocha-700 mb-2 px-1">
                  Custom goals
                </h2>
                <div className="flex flex-col gap-2">
                  {goalEntries.map((g, index) => (
                    <div
                      key={`${g.entry_date}-${g.title}-${index}`}
                      className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-medium text-mocha-700">
                          {g.title}
                        </div>
                        <div className="text-xs text-mocha-400">
                          {formatDate(g.entry_date)}
                        </div>
                      </div>
                      <Pill>
                        {g.kind === "count"
                          ? `${g.amount} ${g.unit || ""}`.trim()
                          : g.completed
                            ? "Done"
                            : "Not done"}
                      </Pill>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <GlassCard className="p-3">
      <div className="flex items-center gap-1.5 text-mocha-400 text-xs">
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl font-semibold text-mocha-700 tabular-nums mt-1">
        {value}
      </div>
    </GlassCard>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-cream-200/80 rounded-full px-2.5 py-1 text-xs text-mocha-500">
      {children}
    </span>
  );
}
