"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Home, Trophy, BookOpen, Sparkles, Moon } from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { TabBar } from "@/components/TabBar";
import { Button } from "@/components/Button";

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
  quran_pages: number;
  zikr_count: number;
  book_pages: number;
};

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [me, setMe] = useState<{ groupName: string } | null>(null);
  const [student, setStudent] = useState<{ display_name: string } | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
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
      setLoading(false);
    })();
  }, [params.id, router]);

  async function onRemove() {
    if (!confirm("Remove this student? Their data will be deleted.")) return;
    await fetch(`/api/leader/members/${params.id}`, { method: "DELETE" });
    router.push("/leader/dashboard");
  }

  const tabs = [
    { href: "/leader/dashboard", label: "Members", icon: <Home size={16} /> },
    { href: "/leader/contests", label: "Contests", icon: <Trophy size={16} /> },
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
      a.fajrCemaat += e.fajr_cemaat ? 1 : 0;
      a.tahajjud += e.tahajjud ? 1 : 0;
      return a;
    },
    { quran: 0, zikr: 0, book: 0, fajrCemaat: 0, tahajjud: 0 }
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
          <Stat icon={<Moon size={14} />} v={totals.fajrCemaat} l="Fajr cemaat days" />
          <Stat icon={<Moon size={14} />} v={totals.tahajjud} l="Tahajjud days" />
        </div>

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
                  <div className="text-sm font-medium text-mocha-700 tabular-nums w-24">
                    {e.entry_date}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-mocha-500">
                    <Pill>Prayers {prayers}/5</Pill>
                    <Pill>Cemaat {cemaat}</Pill>
                    <Pill>Sunnah {optional}</Pill>
                    <Pill>Quran {e.quran_pages}</Pill>
                    <Pill>Zikr {e.zikr_count}</Pill>
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
