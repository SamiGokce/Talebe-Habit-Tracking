"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Home, Trophy, Medal, Target, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { TabBar } from "@/components/TabBar";
import { Button } from "@/components/Button";
import { formatDateRange } from "@/lib/date-format";
import { HABIT_LABELS, type HabitKey } from "@/lib/types";

type Contest = {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  scoring: Record<HabitKey, number>;
};

type Row = {
  student_id: string;
  display_name: string;
  points: number;
  days: number;
};

export default function LeaderContestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [me, setMe] = useState<{ groupName: string } | null>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<Row[]>([]);
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
      const res = await fetch(`/api/contests/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        router.push("/leader/contests");
        return;
      }
      setContest(data.contest);
      setLeaderboard(data.leaderboard);
      setLoading(false);
    })();
  }, [params.id, router]);

  async function onDelete() {
    if (!confirm("Delete this contest? Member entries are not deleted.")) return;
    await fetch(`/api/contests/${params.id}`, { method: "DELETE" });
    router.push("/leader/contests");
  }

  const tabs = [
    { href: "/leader/dashboard", label: "Members", icon: <Home size={16} /> },
    { href: "/leader/goals", label: "Goals", icon: <Target size={16} /> },
    { href: "/leader/contests", label: "Contests", icon: <Trophy size={16} /> },
    { href: "/leader/reports", label: "Reports", icon: <Calendar size={16} /> },
  ];

  if (loading || !contest) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-mocha-500 animate-pulse">Loading…</div>
      </main>
    );
  }

  const scoringEntries = (
    Object.entries(contest.scoring) as [HabitKey, number][]
  ).filter(([, v]) => v > 0);

  return (
    <main className="min-h-screen pb-28">
      <Header title="Talebe" subtitle={me?.groupName} logoutPath="group" />
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <Link
          href="/leader/contests"
          className="tap inline-flex items-center gap-1 text-mocha-500 text-sm mb-4"
        >
          <ArrowLeft size={16} /> Back to contests
        </Link>

        <GlassCard className="p-6 mb-5 animate-slide-up">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-gold/20 text-accent-gold flex items-center justify-center">
                <Trophy size={20} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold text-mocha-700">
                  {contest.name}
                </h1>
                <div className="text-xs text-mocha-500">
                  {formatDateRange(contest.start_date, contest.end_date)}
                </div>
              </div>
            </div>
            <Button variant="danger" onClick={onDelete}>
              <Trash2 size={16} />
            </Button>
          </div>
          {contest.description && (
            <p className="text-mocha-600 text-sm mt-2">{contest.description}</p>
          )}
        </GlassCard>

        <GlassCard className="p-5 mb-5">
          <div className="text-sm font-medium text-mocha-600 mb-2">Scoring</div>
          <div className="flex flex-wrap gap-2">
            {scoringEntries.length === 0 ? (
              <span className="text-mocha-400 text-sm">
                No scoring set — leaderboard will be empty.
              </span>
            ) : (
              scoringEntries.map(([k, v]) => (
                <span
                  key={k}
                  className="bg-cream-200/80 rounded-full px-3 py-1 text-xs text-mocha-600"
                >
                  {HABIT_LABELS[k]} · {v}pt
                </span>
              ))
            )}
          </div>
        </GlassCard>

        <h2 className="font-display text-lg font-semibold text-mocha-700 mb-2 px-1">
          Leaderboard
        </h2>
        {leaderboard.length === 0 ? (
          <GlassCard className="p-8 text-center text-mocha-500">
            No entries in this date range yet.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-2">
            {leaderboard.map((r, i) => (
              <div
                key={r.student_id}
                className="glass-strong rounded-2xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-semibold ${
                      i === 0
                        ? "bg-accent-gold/30 text-mocha-700"
                        : i === 1
                          ? "bg-mocha-200 text-mocha-700"
                          : i === 2
                            ? "bg-mocha-100 text-mocha-600"
                            : "bg-cream-200 text-mocha-500"
                    }`}
                  >
                    {i < 3 ? <Medal size={16} /> : i + 1}
                  </div>
                  <div>
                    <div className="font-medium text-mocha-700">
                      {r.display_name}
                    </div>
                    <div className="text-xs text-mocha-400">
                      {r.days} day{r.days === 1 ? "" : "s"} logged
                    </div>
                  </div>
                </div>
                <div className="font-display text-2xl font-semibold text-mocha-700 tabular-nums">
                  {r.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <TabBar tabs={tabs} />
    </main>
  );
}
