"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Home, Trophy, X } from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { TabBar } from "@/components/TabBar";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import {
  ALL_HABIT_KEYS,
  DEFAULT_SCORING,
  HABIT_LABELS,
  type HabitKey,
} from "@/lib/types";

type Contest = {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
};

export default function LeaderContestsPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ groupName: string } | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.leader) {
        router.push("/leader");
        return;
      }
      setMe({ groupName: meData.leader.groupName });
      const res = await fetch("/api/contests");
      const data = await res.json();
      setContests(data.contests || []);
      setLoading(false);
    })();
  }, [router]);

  const tabs = [
    { href: "/leader/dashboard", label: "Members", icon: <Home size={16} /> },
    { href: "/leader/contests", label: "Contests", icon: <Trophy size={16} /> },
  ];

  const now = new Date().toISOString().slice(0, 10);
  const active = contests.filter(
    (c) => c.start_date <= now && c.end_date >= now
  );
  const upcoming = contests.filter((c) => c.start_date > now);
  const past = contests.filter((c) => c.end_date < now);

  return (
    <main className="min-h-screen pb-28">
      <Header title="Talebe" subtitle={me?.groupName} logoutPath="group" />
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display text-3xl font-semibold text-mocha-700">
            Contests
          </h1>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} /> New
          </Button>
        </div>

        {loading ? (
          <div className="text-mocha-500">Loading…</div>
        ) : contests.length === 0 ? (
          <GlassCard className="p-8 text-center text-mocha-500">
            No contests yet. Create one for Ramadan, holy nights, or any
            initiative to motivate your students.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-6">
            <Group title="Active" items={active} />
            <Group title="Upcoming" items={upcoming} />
            <Group title="Past" items={past} />
          </div>
        )}
      </div>
      <TabBar tabs={tabs} />
      {showForm && (
        <NewContestModal
          onClose={() => setShowForm(false)}
          onCreated={(c) => {
            setContests((prev) => [c, ...prev]);
            setShowForm(false);
          }}
        />
      )}
    </main>
  );
}

function Group({ title, items }: { title: string; items: Contest[] }) {
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
            href={`/leader/contests/${c.id}`}
            className="tap glass-strong rounded-2xl p-4 flex items-center justify-between hover:shadow-glass-lg"
          >
            <div>
              <div className="font-semibold text-mocha-700">{c.name}</div>
              <div className="text-xs text-mocha-500 mt-0.5">
                {c.start_date} → {c.end_date}
              </div>
            </div>
            <Trophy size={20} className="text-accent-gold" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function NewContestModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Contest) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const monthLater = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(monthLater);
  const [scoring, setScoring] = useState<Record<HabitKey, number>>({
    ...DEFAULT_SCORING,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/contests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        start_date: startDate,
        end_date: endDate,
        scoring,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create contest.");
      setLoading(false);
      return;
    }
    onCreated(data.contest);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-mocha-800/30 backdrop-blur-sm animate-fade-in">
      <div className="glass-strong rounded-3xl w-full max-w-lg max-h-[88vh] overflow-y-auto p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold text-mocha-700">
            New contest
          </h2>
          <button
            onClick={onClose}
            className="tap p-2 rounded-full hover:bg-cream-200/60 text-mocha-500"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ramadan 2026"
            required
          />
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this contest about?"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="mt-2">
            <div className="text-sm font-medium text-mocha-600 mb-2">
              Points per habit
            </div>
            <p className="text-xs text-mocha-400 mb-3">
              Set 0 to exclude a habit. Counts (Quran/zikr/book) multiply by the
              amount.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_HABIT_KEYS.map((k) => (
                <label
                  key={k}
                  className="glass-soft rounded-xl px-3 py-2 flex items-center justify-between gap-2"
                >
                  <span className="text-sm text-mocha-600">
                    {HABIT_LABELS[k]}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={scoring[k]}
                    onChange={(e) =>
                      setScoring((s) => ({
                        ...s,
                        [k]: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-14 text-right bg-transparent outline-none text-mocha-700 font-medium tabular-nums"
                  />
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-accent-rose bg-accent-rose/10 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button variant="ghost" type="button" onClick={onClose} block>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} block>
              {loading ? "Creating…" : "Create contest"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
