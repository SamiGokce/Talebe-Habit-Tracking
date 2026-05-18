"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calendar,
  Home,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { TabBar } from "@/components/TabBar";

type Report = {
  days: number;
  members: number;
  activeStudents: number;
  loggedDays: number;
  all5Rate: number;
  cemaatAverage: number;
  totals: {
    quran_pages: number;
    zikr_count: number;
    book_pages: number;
  };
  insights: string[];
  trends: {
    quran: { older: number; recent: number };
    cemaat: { older: number; recent: number };
    reading: { older: number; recent: number };
  };
};

export default function LeaderReportsPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ groupName: string } | null>(null);
  const [report, setReport] = useState<Report | null>(null);
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
      const res = await fetch("/api/leader/reports?days=30");
      const data = await res.json();
      setReport(data);
      setLoading(false);
    })();
  }, [router]);

  const tabs = [
    { href: "/leader/dashboard", label: "Members", icon: <Home size={16} /> },
    { href: "/leader/goals", label: "Goals", icon: <Target size={16} /> },
    { href: "/leader/contests", label: "Contests", icon: <Trophy size={16} /> },
    { href: "/leader/reports", label: "Reports", icon: <Calendar size={16} /> },
  ];

  if (loading || !report) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-mocha-500 animate-pulse">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-28">
      <Header title="Talebe" subtitle={me?.groupName} logoutPath="group" />
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <h1 className="font-display text-3xl font-semibold text-mocha-700 mb-5">
          Reports
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Stat icon={<Users size={16} />} value={report.members} label="Members" />
          <Stat
            icon={<Sparkles size={16} />}
            value={report.activeStudents}
            label="Active 30d"
          />
          <Stat
            icon={<BarChart3 size={16} />}
            value={`${report.all5Rate}%`}
            label="All 5 rate"
          />
          <Stat
            icon={<Users size={16} />}
            value={report.cemaatAverage}
            label="Avg cemaat"
          />
        </div>

        <GlassCard className="p-5 mb-5">
          <div className="text-sm font-medium text-mocha-600 mb-3">
            Trend summaries
          </div>
          <div className="flex flex-col gap-2">
            {report.insights.map((insight) => (
              <div
                key={insight}
                className="bg-cream-100/70 rounded-2xl px-4 py-3 text-sm text-mocha-600"
              >
                {insight}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 mb-5">
          <div className="text-sm font-medium text-mocha-600 mb-3">
            Last 30 days
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <BigStat
              icon={<BookOpen size={16} />}
              value={report.totals.quran_pages}
              label="Quran pages"
            />
            <BigStat
              icon={<Sparkles size={16} />}
              value={report.totals.zikr_count}
              label="Zikr"
            />
            <BigStat
              icon={<BookOpen size={16} />}
              value={report.totals.book_pages}
              label="Book pages"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-sm font-medium text-mocha-600 mb-4">
            Recent change
          </div>
          <div className="flex flex-col gap-4">
            <Trend label="Quran" trend={report.trends.quran} />
            <Trend label="Cemaat" trend={report.trends.cemaat} />
            <Trend label="Reading" trend={report.trends.reading} />
          </div>
        </GlassCard>
      </div>
      <TabBar tabs={tabs} />
    </main>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <GlassCard className="p-4 flex flex-col items-start gap-1">
      <div className="text-mocha-400">{icon}</div>
      <div className="font-display text-2xl font-semibold text-mocha-700 tabular-nums">
        {value}
      </div>
      <div className="text-xs text-mocha-400">{label}</div>
    </GlassCard>
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

function Trend({
  label,
  trend,
}: {
  label: string;
  trend: { older: number; recent: number };
}) {
  const max = Math.max(trend.older, trend.recent, 1);
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-mocha-600">{label}</span>
        <span className="text-xs text-mocha-400">
          {trend.older.toFixed(1)} to {trend.recent.toFixed(1)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Bar value={trend.older} max={max} label="Earlier" />
        <Bar value={trend.recent} max={max} label="Recent" />
      </div>
    </div>
  );
}

function Bar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  return (
    <div>
      <div className="h-3 rounded-full bg-cream-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-sage"
          style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
        />
      </div>
      <div className="text-xs text-mocha-400 mt-1">{label}</div>
    </div>
  );
}
