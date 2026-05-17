"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Home, Trophy } from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { TabBar } from "@/components/TabBar";

type Contest = {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
};

export default function StudentContestsPage() {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [me, setMe] = useState<{ displayName: string } | null>(null);
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
      const res = await fetch("/api/contests");
      const data = await res.json();
      setContests(data.contests || []);
      setLoading(false);
    })();
  }, [router]);

  const tabs = [
    { href: "/student/today", label: "Today", icon: <Home size={16} /> },
    { href: "/student/stats", label: "Stats", icon: <Calendar size={16} /> },
    {
      href: "/student/contests",
      label: "Contests",
      icon: <Trophy size={16} />,
    },
  ];

  const now = new Date().toISOString().slice(0, 10);
  const active = contests.filter(
    (c) => c.start_date <= now && c.end_date >= now
  );
  const upcoming = contests.filter((c) => c.start_date > now);
  const past = contests.filter((c) => c.end_date < now);

  return (
    <main className="min-h-screen pb-28">
      <Header title="Talebe" subtitle={me?.displayName} logoutPath="student" />
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <h1 className="font-display text-3xl font-semibold text-mocha-700 mb-5">
          Contests
        </h1>

        {loading ? (
          <div className="text-mocha-500">Loading…</div>
        ) : contests.length === 0 ? (
          <GlassCard className="p-8 text-center text-mocha-500">
            No contests yet. Your group leader can start one for occasions like
            Ramadan or holy nights.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-6">
            <Group title="Active" items={active} role="student" />
            <Group title="Upcoming" items={upcoming} role="student" />
            <Group title="Past" items={past} role="student" />
          </div>
        )}
      </div>
      <TabBar tabs={tabs} />
    </main>
  );
}

function Group({
  title,
  items,
  role,
}: {
  title: string;
  items: Contest[];
  role: "student" | "leader";
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-mocha-600 mb-2 px-1">
        {title}
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/${role}/contests/${c.id}`}
            className="tap glass-strong rounded-2xl p-4 flex items-center justify-between hover:shadow-glass-lg"
          >
            <div>
              <div className="font-semibold text-mocha-700">{c.name}</div>
              <div className="text-xs text-mocha-500 mt-0.5">
                {c.start_date} → {c.end_date}
              </div>
              {c.description && (
                <div className="text-sm text-mocha-500 mt-1">
                  {c.description}
                </div>
              )}
            </div>
            <Trophy size={20} className="text-accent-gold" />
          </Link>
        ))}
      </div>
    </section>
  );
}
