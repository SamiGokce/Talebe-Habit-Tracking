"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Home, Plus, Sparkles, Target, Trophy, X } from "lucide-react";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import { TabBar } from "@/components/TabBar";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  kind: "boolean" | "count";
  unit: string | null;
  points: number;
  starts_on: string | null;
  ends_on: string | null;
  active: boolean;
  student_id: string | null;
  student_name: string | null;
  created_by_role: "talebe" | "mentor" | "uniteci";
};

type Member = {
  id: string;
  display_name: string;
};

export default function LeaderGoalsPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ groupName: string } | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
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
      const [goalsRes, membersRes] = await Promise.all([
        fetch("/api/goals"),
        fetch("/api/leader/members"),
      ]);
      const goalsData = await goalsRes.json();
      const membersData = await membersRes.json();
      setGoals(goalsData.goals || []);
      setMembers(membersData.members || []);
      setLoading(false);
    })();
  }, [router]);

  const tabs = [
    { href: "/leader/dashboard", label: "Members", icon: <Home size={16} /> },
    { href: "/leader/goals", label: "Goals", icon: <Target size={16} /> },
    { href: "/leader/contests", label: "Contests", icon: <Trophy size={16} /> },
    { href: "/leader/reports", label: "Reports", icon: <Calendar size={16} /> },
  ];

  return (
    <main className="min-h-screen pb-28">
      <Header title="Talebe" subtitle={me?.groupName} logoutPath="group" />
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display text-3xl font-semibold text-mocha-700">
            Goals
          </h1>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} /> New
          </Button>
        </div>

        {loading ? (
          <div className="text-mocha-500">Loading...</div>
        ) : goals.length === 0 ? (
          <GlassCard className="p-8 text-center text-mocha-500">
            No custom goals yet.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-2">
            {goals.map((g) => (
              <GlassCard key={g.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-mocha-700">
                      {g.title}
                    </div>
                    <div className="text-xs text-mocha-400 mt-0.5">
                      {g.student_name ? g.student_name : "Whole group"} /{" "}
                      {g.kind === "count" ? `Count${g.unit ? ` ${g.unit}` : ""}` : "Done"} /{" "}
                      {g.points} pt
                    </div>
                    {g.description && (
                      <div className="text-sm text-mocha-500 mt-2">
                        {g.description}
                      </div>
                    )}
                  </div>
                  <div
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      g.active
                        ? "bg-accent-sage/20 text-accent-sage"
                        : "bg-cream-200 text-mocha-400"
                    }`}
                  >
                    {g.active ? "Active" : "Paused"}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
      <TabBar tabs={tabs} />
      {showForm && (
        <NewGoalModal
          members={members}
          onClose={() => setShowForm(false)}
          onCreated={(goal) => {
            setGoals((prev) => [goal, ...prev]);
            setShowForm(false);
          }}
        />
      )}
    </main>
  );
}

function NewGoalModal({
  members,
  onClose,
  onCreated,
}: {
  members: Member[];
  onClose: () => void;
  onCreated: (goal: Goal) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"boolean" | "count">("boolean");
  const [unit, setUnit] = useState("");
  const [points, setPoints] = useState(1);
  const [studentId, setStudentId] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
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
        description,
        kind,
        unit,
        points,
        student_id: studentId || null,
        starts_on: startsOn || null,
        ends_on: endsOn || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create goal.");
      setLoading(false);
      return;
    }
    onCreated({
      ...data.goal,
      student_name:
        members.find((m) => m.id === data.goal.student_id)?.display_name ??
        null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-mocha-800/30 backdrop-blur-sm animate-fade-in">
      <div className="glass-strong rounded-3xl w-full max-w-lg max-h-[88vh] overflow-y-auto p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold text-mocha-700">
            Assign goal
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
            placeholder="e.g. Read Risale-i Nur"
            required
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional note for students"
          />

          <div>
            <div className="text-sm font-medium text-mocha-600 mb-1.5">
              Assign to
            </div>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full glass-strong rounded-2xl px-4 py-3 text-base text-mocha-800 outline-none"
            >
              <option value="">Whole group</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-medium text-mocha-600 mb-1.5">
                Style
              </div>
              <div className="glass-soft rounded-2xl p-1 flex">
                {(["boolean", "count"] as const).map((k) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setKind(k)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium tap transition ${
                      kind === k
                        ? "bg-mocha-600 text-cream-50"
                        : "text-mocha-500"
                    }`}
                  >
                    {k === "boolean" ? "Done" : "Count"}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Points"
              type="number"
              min={0}
              max={999}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
            />
          </div>

          {kind === "count" && (
            <Input
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="pages, minutes, times"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Starts"
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
            />
            <Input
              label="Ends"
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
            />
          </div>

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
