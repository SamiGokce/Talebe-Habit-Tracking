"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { GlassCard } from "@/components/GlassCard";

type Role = "talebe" | "mentor" | "uniteci" | "admin";

type User = {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  created_at: string;
};

const ROLES: Role[] = ["talebe", "mentor", "uniteci", "admin"];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.account) {
        router.push("/account?next=/admin/users");
        return;
      }
      if (meData.account.role !== "admin") {
        router.push("/");
        return;
      }
      setCurrentUserId(meData.account.userId);

      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load users.");
        setLoading(false);
        return;
      }
      setUsers(data.users || []);
      setLoading(false);
    })();
  }, [router]);

  async function setRole(userId: string, role: Role) {
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not update role.");
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    );
  }

  async function deleteUser(user: User) {
    if (user.id === currentUserId) return;
    if (!confirm(`Delete ${user.display_name}? Their student data will be removed.`)) {
      return;
    }

    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete user.");
      return;
    }
    setUsers((prev) => prev.filter((item) => item.id !== user.id));
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-mocha-500 animate-pulse">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="tap inline-flex items-center gap-1 text-mocha-500 text-sm mb-6"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex items-center gap-2 mb-5">
          <Shield size={24} className="text-mocha-600" />
          <h1 className="font-display text-3xl font-semibold text-mocha-700">
            User roles
          </h1>
        </div>

        {error && (
          <div className="text-sm text-accent-rose bg-accent-rose/10 rounded-xl px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <GlassCard
              key={u.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-mocha-700">
                  {u.display_name}
                </div>
                <div className="text-xs text-mocha-400">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => setRole(u.id, e.target.value as Role)}
                  className="glass-soft rounded-2xl px-3 py-2 text-sm text-mocha-700 outline-none"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => deleteUser(u)}
                  disabled={u.id === currentUserId}
                  className="px-3 py-2 text-sm"
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </main>
  );
}
