"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { Button } from "@/components/Button";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/Input";

type Account = {
  userId: string;
  displayName: string;
  role: "talebe" | "mentor" | "uniteci" | "admin";
};

type Group = {
  id: string;
  code: string;
  name: string;
  mentor_name: string | null;
  unite_name: string | null;
};

type Mentor = {
  id: string;
  display_name: string;
  email: string;
  role: string;
};

type UniteOption = {
  id: string;
  name: string;
};

export default function LeaderEntryPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [unites, setUnites] = useState<UniteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [mentorUserId, setMentorUserId] = useState("");
  const [uniteId, setUniteId] = useState("");

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.account) {
        router.push("/account?next=/leader");
        return;
      }
      setAccount(meData.account);
      if (meData.leader) {
        router.push("/leader/dashboard");
        return;
      }

      const res = await fetch("/api/groups/manageable");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load groups.");
        setLoading(false);
        return;
      }
      setGroups(data.groups || []);
      setMentors(data.mentors || []);
      setUnites(data.unites || []);
      if (data.unites?.length === 1) {
        setUniteId(data.unites[0].id);
      }
      setLoading(false);
    })();
  }, [router]);

  const canCreate = account?.role === "uniteci" || account?.role === "admin";

  async function openGroup(id: string) {
    setError(null);
    const res = await fetch("/api/groups/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not open group.");
      return;
    }
    router.push("/leader/dashboard");
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/groups/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mentor_name: mentorName,
        mentor_user_id: mentorUserId || null,
        unite_id: uniteId,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create group.");
      setCreating(false);
      return;
    }
    router.push("/leader/dashboard");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-mocha-500 animate-pulse">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="tap inline-flex items-center gap-1 text-mocha-500 text-sm mb-6"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="mb-5">
          <h1 className="font-display text-3xl font-semibold text-mocha-700">
            Mentor access
          </h1>
          <p className="text-mocha-500 mt-1">
            Signed in as {account?.displayName}. Group creation is limited to
            unitecis.
          </p>
        </div>

        {error && (
          <div className="text-sm text-accent-rose bg-accent-rose/10 rounded-xl px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <section className="mb-6">
          <h2 className="font-display text-lg font-semibold text-mocha-700 mb-2 px-1">
            Your groups
          </h2>
          {groups.length === 0 ? (
            <GlassCard className="p-6 text-mocha-500">
              No groups are assigned to this account yet.
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-2">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => openGroup(g.id)}
                  className="tap glass-strong rounded-2xl p-4 flex items-center justify-between text-left"
                >
                  <div>
                    <div className="font-semibold text-mocha-700">{g.name}</div>
                    <div className="text-xs text-mocha-400">
                      {g.unite_name ? `${g.unite_name} / ` : ""}
                      {g.code}
                    </div>
                  </div>
                  <Users size={20} className="text-mocha-500" />
                </button>
              ))}
            </div>
          )}
        </section>

        {canCreate && (
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4 text-mocha-700">
              <Plus size={18} />
              <h2 className="font-display text-xl font-semibold">
                Create group
              </h2>
            </div>
            <form onSubmit={createGroup} className="flex flex-col gap-4">
              <div>
                <div className="text-sm font-medium text-mocha-600 mb-1.5">
                  Unite
                </div>
                <select
                  value={uniteId}
                  onChange={(e) => setUniteId(e.target.value)}
                  className="w-full glass-strong rounded-2xl px-4 py-3 text-base text-mocha-800 outline-none"
                  required
                >
                  <option value="">Choose unite</option>
                  {unites.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Saturday Halaqa"
                required
              />
              <Input
                label="Mentor display name"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                placeholder="Shown to members"
              />
              <div>
                <div className="text-sm font-medium text-mocha-600 mb-1.5">
                  Assign mentor account
                </div>
                <select
                  value={mentorUserId}
                  onChange={(e) => setMentorUserId(e.target.value)}
                  className="w-full glass-strong rounded-2xl px-4 py-3 text-base text-mocha-800 outline-none"
                >
                  <option value="">No mentor yet</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" block disabled={creating}>
                {creating ? "Creating..." : "Create group"}
              </Button>
            </form>
          </GlassCard>
        )}
      </div>
    </main>
  );
}
