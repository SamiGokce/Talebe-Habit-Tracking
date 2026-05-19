"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  Plus,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/Button";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/Input";

type Account = {
  displayName: string;
  role: "talebe" | "mentor" | "uniteci" | "admin";
};

type Unite = {
  id: string;
  name: string;
  description: string | null;
  uniteci_user_id: string | null;
  uniteci_name: string | null;
  group_count: number;
  student_count: number;
};

type Uniteci = {
  id: string;
  display_name: string;
  email: string;
};

export default function PanelHomePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [unitecis, setUnitecis] = useState<Uniteci[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uniteciId, setUniteciId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.account) {
        router.push("/account?next=/panel");
        return;
      }
      if (!["admin", "uniteci"].includes(meData.account.role)) {
        router.push("/");
        return;
      }
      setAccount(meData.account);

      const res = await fetch("/api/panel/unites");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load panel.");
        setLoading(false);
        return;
      }
      setUnites(data.unites || []);
      setUnitecis(data.unitecis || []);
      setLoading(false);
    })();
  }, [router]);

  async function createUnite(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const res = await fetch("/api/panel/unites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        uniteci_user_id: uniteciId || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create unite.");
      setCreating(false);
      return;
    }
    setUnites((prev) => [
      { ...data.unite, uniteci_name: null, group_count: 0, student_count: 0 },
      ...prev,
    ]);
    setName("");
    setDescription("");
    setUniteciId("");
    setCreating(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-mocha-500 animate-pulse">Loading...</div>
      </main>
    );
  }

  const isAdmin = account?.role === "admin";

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="tap inline-flex items-center gap-1 text-mocha-500 text-sm mb-6"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-accent-sage/15 text-accent-sage flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-mocha-700">
              {isAdmin ? "Admin panel" : "Uniteci panel"}
            </h1>
            <p className="text-sm text-mocha-500">
              {isAdmin ? "All unites" : "Groups in your unite"}
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-accent-rose bg-accent-rose/10 rounded-xl px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {isAdmin && (
          <GlassCard className="p-4 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Link
                href="/admin/groups"
                className="tap glass-soft rounded-2xl px-4 py-3 flex items-center gap-2 text-mocha-700 font-medium"
              >
                <Building2 size={17} /> All groups
              </Link>
              <Link
                href="/admin/students"
                className="tap glass-soft rounded-2xl px-4 py-3 flex items-center gap-2 text-mocha-700 font-medium"
              >
                <GraduationCap size={17} /> All students
              </Link>
              <Link
                href="/admin/users"
                className="tap glass-soft rounded-2xl px-4 py-3 flex items-center gap-2 text-mocha-700 font-medium"
              >
                <Shield size={17} /> User roles
              </Link>
            </div>
          </GlassCard>
        )}

        {isAdmin && (
          <GlassCard className="p-5 mb-5">
            <div className="flex items-center gap-2 mb-4 text-mocha-700">
              <Plus size={18} />
              <h2 className="font-display text-xl font-semibold">
                Create unite
              </h2>
            </div>
            <form onSubmit={createUnite} className="flex flex-col gap-3">
              <Input
                label="Unite name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Toronto West"
                required
              />
              <Input
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional note"
              />
              <div>
                <div className="text-sm font-medium text-mocha-600 mb-1.5">
                  Assigned uniteci
                </div>
                <select
                  value={uniteciId}
                  onChange={(e) => setUniteciId(e.target.value)}
                  className="w-full glass-strong rounded-2xl px-4 py-3 text-base text-mocha-800 outline-none"
                >
                  <option value="">No uniteci yet</option>
                  {unitecis.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create unite"}
              </Button>
            </form>
          </GlassCard>
        )}

        {unites.length === 0 ? (
          <GlassCard className="p-8 text-center text-mocha-500">
            No unites yet.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-2">
            {unites.map((unite) => (
              <Link
                key={unite.id}
                href={`/panel/unites/${unite.id}`}
                className="tap glass-strong rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-mocha-700">
                    {unite.name}
                  </div>
                  <div className="text-xs text-mocha-400">
                    Uniteci: {unite.uniteci_name || "Unassigned"}
                  </div>
                  {unite.description && (
                    <div className="text-sm text-mocha-500 mt-1">
                      {unite.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-mocha-500">
                  <span>{unite.group_count} groups</span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} /> {unite.student_count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
