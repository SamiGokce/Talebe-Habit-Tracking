"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  Users,
  Trophy,
  Home,
  Calendar,
  Target,
  BookOpen,
  Sparkles,
  Moon,
} from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { TabBar } from "@/components/TabBar";

type Member = {
  id: string;
  display_name: string;
  created_at: string;
  last_entry_date: string | null;
  fajr: boolean | null;
  fajr_cemaat: boolean | null;
  dhuhr: boolean | null;
  dhuhr_cemaat: boolean | null;
  asr: boolean | null;
  asr_cemaat: boolean | null;
  maghrib: boolean | null;
  maghrib_cemaat: boolean | null;
  isha: boolean | null;
  isha_cemaat: boolean | null;
  tahajjud: boolean | null;
  duha: boolean | null;
  evvabin: boolean | null;
  cevsen: boolean | null;
  quran_pages: number | null;
  zikr_count: number | null;
  book_pages: number | null;
};

type Leader = { groupCode: string; groupName: string };

export default function LeaderDashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Leader | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.leader) {
        router.push("/leader");
        return;
      }
      setMe({
        groupCode: meData.leader.groupCode,
        groupName: meData.leader.groupName,
      });
      try {
        const res = await fetch("/api/leader/members");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Could not load members.");
          setLoading(false);
          return;
        }
        setMembers(data.members || []);
        setLoading(false);
      } catch {
        setError("Could not load members.");
        setLoading(false);
      }
    })();
  }, [router]);

  const today = new Date().toISOString().slice(0, 10);
  const summary = useMemo(() => {
    const active = members.filter((m) => m.last_entry_date === today).length;
    const totalPrayers = members.reduce((acc, m) => {
      if (m.last_entry_date !== today) return acc;
      return (
        acc +
        [m.fajr, m.dhuhr, m.asr, m.maghrib, m.isha].filter(Boolean).length
      );
    }, 0);
    const totalQuran = members.reduce(
      (acc, m) =>
        m.last_entry_date === today ? acc + (m.quran_pages || 0) : acc,
      0
    );
    const totalZikr = members.reduce(
      (acc, m) =>
        m.last_entry_date === today ? acc + (m.zikr_count || 0) : acc,
      0
    );
    return { active, totalPrayers, totalQuran, totalZikr };
  }, [members, today]);

  const tabs = [
    { href: "/leader/dashboard", label: "Members", icon: <Home size={16} /> },
    { href: "/leader/goals", label: "Goals", icon: <Target size={16} /> },
    { href: "/leader/contests", label: "Contests", icon: <Trophy size={16} /> },
    { href: "/leader/reports", label: "Reports", icon: <Calendar size={16} /> },
  ];

  async function copyCode() {
    if (!me) return;
    await navigator.clipboard.writeText(me.groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading || !me) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-mocha-500 animate-pulse">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-28">
      <Header title="Talebe" subtitle={me.groupName} logoutPath="group" />
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <GlassCard className="p-5 mb-5 animate-slide-up">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-mocha-400 mb-1">Group invite code</div>
              <div className="font-display text-3xl tracking-widest font-semibold text-mocha-700">
                {me.groupCode}
              </div>
            </div>
            <button
              onClick={copyCode}
              className="tap glass-strong rounded-2xl px-4 py-3 flex items-center gap-2 text-mocha-600 text-sm font-medium"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-accent-sage" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy
                </>
              )}
            </button>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 animate-slide-up">
          <Stat
            icon={<Users size={16} />}
            value={members.length}
            label="Members"
          />
          <Stat
            icon={<Check size={16} />}
            value={summary.active}
            label="Logged today"
          />
          <Stat
            icon={<BookOpen size={16} />}
            value={summary.totalQuran}
            label="Quran pages today"
          />
          <Stat
            icon={<Sparkles size={16} />}
            value={summary.totalZikr}
            label="Zikr today"
          />
        </div>

        <h2 className="font-display text-lg font-semibold text-mocha-700 mb-2 px-1">
          Members
        </h2>

        {error ? (
          <GlassCard className="p-5 text-mocha-500">
            <div className="font-medium text-mocha-700 mb-1">
              Dashboard needs database setup
            </div>
            <div className="text-sm">{error}</div>
          </GlassCard>
        ) : members.length === 0 ? (
          <GlassCard className="p-8 text-center text-mocha-500">
            No students yet. Share your group code with them to get started.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((m) => {
              const prayers = m.last_entry_date === today
                ? [m.fajr, m.dhuhr, m.asr, m.maghrib, m.isha].filter(Boolean)
                    .length
                : 0;
              const cemaat = m.last_entry_date === today
                ? [
                    m.fajr_cemaat,
                    m.dhuhr_cemaat,
                    m.asr_cemaat,
                    m.maghrib_cemaat,
                    m.isha_cemaat,
                  ].filter(Boolean).length
                : 0;
              const isToday = m.last_entry_date === today;
              return (
                <Link
                  key={m.id}
                  href={`/leader/members/${m.id}`}
                  className="tap glass-strong rounded-2xl p-4 flex items-center justify-between hover:shadow-glass-lg"
                >
                  <div>
                    <div className="font-medium text-mocha-700">
                      {m.display_name}
                    </div>
                    <div className="text-xs text-mocha-400">
                      {m.last_entry_date
                        ? `Last entry: ${m.last_entry_date}`
                        : "No entries yet"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      icon={<Moon size={12} />}
                      value={`${prayers}/5`}
                      active={isToday && prayers === 5}
                    />
                    <Badge
                      icon={<Users size={12} />}
                      value={String(cemaat)}
                      active={isToday && cemaat > 0}
                    />
                    <Badge
                      icon={<BookOpen size={12} />}
                      value={String(isToday ? m.quran_pages ?? 0 : 0)}
                      active={isToday && (m.quran_pages ?? 0) > 0}
                    />
                  </div>
                </Link>
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

function Badge({
  icon,
  value,
  active,
}: {
  icon: React.ReactNode;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium tabular-nums ${
        active
          ? "bg-accent-sage/20 text-accent-sage"
          : "bg-cream-200/80 text-mocha-400"
      }`}
    >
      {icon}
      {value}
    </div>
  );
}
