"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Home, Trophy, Medal } from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { TabBar } from "@/components/TabBar";
import { formatDateRange } from "@/lib/date-format";

type Contest = {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  scoring: Record<string, number>;
};

type Row = {
  student_id: string;
  display_name: string;
  points: number;
  days: number;
};

export default function ContestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<Row[]>([]);
  const [me, setMe] = useState<{ studentId: string; displayName: string } | null>(
    null
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
      setMe({
        studentId: meData.student.studentId,
        displayName: meData.student.displayName,
      });
      const res = await fetch(`/api/contests/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        router.push("/student/contests");
        return;
      }
      setContest(data.contest);
      setLeaderboard(data.leaderboard);
      setLoading(false);
    })();
  }, [params.id, router]);

  const tabs = [
    { href: "/student/today", label: "Today", icon: <Home size={16} /> },
    { href: "/student/stats", label: "Stats", icon: <Calendar size={16} /> },
    {
      href: "/student/contests",
      label: "Contests",
      icon: <Trophy size={16} />,
    },
  ];

  if (loading || !contest) {
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
        <Link
          href="/student/contests"
          className="tap inline-flex items-center gap-1 text-mocha-500 text-sm mb-4"
        >
          <ArrowLeft size={16} /> Back to contests
        </Link>

        <GlassCard className="p-6 mb-5 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
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
          {contest.description && (
            <p className="text-mocha-600 text-sm">{contest.description}</p>
          )}
        </GlassCard>

        <h2 className="font-display text-lg font-semibold text-mocha-700 mb-2 px-1">
          Leaderboard
        </h2>
        {leaderboard.length === 0 ? (
          <GlassCard className="p-8 text-center text-mocha-500">
            No entries yet. Start logging your goals to climb the board.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-2">
            {leaderboard.map((r, i) => (
              <div
                key={r.student_id}
                className={`glass-strong rounded-2xl px-4 py-3 flex items-center justify-between ${
                  r.student_id === me?.studentId
                    ? "ring-2 ring-mocha-400/50"
                    : ""
                }`}
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
                      {r.student_id === me?.studentId && (
                        <span className="ml-2 text-xs text-mocha-400">
                          (you)
                        </span>
                      )}
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
