"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Filter,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/Button";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/Input";

type Group = {
  id: string;
  code: string;
  name: string;
  created_at: string;
  unite_id: string | null;
  unite_name: string | null;
  mentor_name: string | null;
  mentor_account_name: string | null;
  student_count: number;
  last_entry_date: string | null;
};

export default function AdminGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [uniteFilter, setUniteFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.account) {
        router.push("/account?next=/admin/groups");
        return;
      }
      if (meData.account.role !== "admin") {
        router.push("/");
        return;
      }

      const res = await fetch("/api/admin/groups");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load groups.");
        setLoading(false);
        return;
      }
      setGroups(data.groups || []);
      setLoading(false);
    })();
  }, [router]);

  const unites = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach((group) => {
      if (group.unite_id) {
        map.set(group.unite_id, group.unite_name || "Unnamed unite");
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    return groups.filter((group) => {
      const haystack = [
        group.name,
        group.code,
        group.unite_name,
        group.mentor_account_name,
        group.mentor_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesUnite =
        uniteFilter === "all" ||
        (uniteFilter === "none" && !group.unite_id) ||
        group.unite_id === uniteFilter;
      const matchesActivity =
        activityFilter === "all" ||
        (activityFilter === "with_students" && group.student_count > 0) ||
        (activityFilter === "empty" && group.student_count === 0);
      return matchesSearch && matchesUnite && matchesActivity;
    });
  }, [activityFilter, groups, query, uniteFilter]);

  async function deleteGroup(group: Group) {
    if (deletingId) return;
    const confirmed = window.confirm(
      `Delete ${group.name}? This will remove the group, its students, and their progress.`
    );
    if (!confirmed) return;

    setDeletingId(group.id);
    setError(null);
    const res = await fetch(`/api/panel/groups/${group.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete group.");
      setDeletingId(null);
      return;
    }

    setGroups((prev) => prev.filter((item) => item.id !== group.id));
    setDeletingId(null);
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
      <div className="max-w-4xl mx-auto">
        <Link
          href="/panel"
          className="tap inline-flex items-center gap-1 text-mocha-500 text-sm mb-6"
        >
          <ArrowLeft size={16} /> Back to panel
        </Link>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-accent-sage/15 text-accent-sage flex items-center justify-center">
            <Users size={23} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-mocha-700">
              All groups
            </h1>
            <p className="text-sm text-mocha-500">
              {filteredGroups.length} of {groups.length} groups shown
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-accent-rose bg-accent-rose/10 rounded-xl px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <GlassCard className="p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_170px] gap-3">
            <Input
              label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, code, unite, mentor"
            />
            <div>
              <div className="text-sm font-medium text-mocha-600 mb-1.5 flex items-center gap-1">
                <Filter size={14} /> Unite
              </div>
              <select
                value={uniteFilter}
                onChange={(e) => setUniteFilter(e.target.value)}
                className="w-full glass-strong rounded-2xl px-4 py-3 text-base text-mocha-800 outline-none"
              >
                <option value="all">All unites</option>
                <option value="none">No unite</option>
                {unites.map((unite) => (
                  <option key={unite.id} value={unite.id}>
                    {unite.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-sm font-medium text-mocha-600 mb-1.5">
                Students
              </div>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-full glass-strong rounded-2xl px-4 py-3 text-base text-mocha-800 outline-none"
              >
                <option value="all">Any count</option>
                <option value="with_students">Has students</option>
                <option value="empty">Empty</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {filteredGroups.length === 0 ? (
          <GlassCard className="p-8 text-center text-mocha-500">
            No groups match these filters.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredGroups.map((group) => (
              <GlassCard
                key={group.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="font-semibold text-mocha-700">
                    {group.name}
                  </div>
                  <div className="text-xs text-mocha-400">
                    {group.unite_name || "No unite"} / {group.code}
                  </div>
                  <div className="text-xs text-mocha-400">
                    Mentor:{" "}
                    {group.mentor_account_name ||
                      group.mentor_name ||
                      "Unassigned"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="bg-cream-200/80 rounded-full px-2.5 py-1 text-xs text-mocha-500 inline-flex items-center gap-1">
                    <Users size={12} /> {group.student_count}
                  </span>
                  <span className="bg-cream-200/80 rounded-full px-2.5 py-1 text-xs text-mocha-500">
                    {group.last_entry_date
                      ? `Active ${group.last_entry_date}`
                      : "No entries"}
                  </span>
                  <Link
                    href={`/panel/groups/${group.id}`}
                    className="tap inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-sm font-medium text-mocha-700 glass-soft"
                  >
                    <ExternalLink size={14} /> Open
                  </Link>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => deleteGroup(group)}
                    disabled={deletingId === group.id}
                    className="px-3 py-2 text-sm"
                  >
                    <Trash2 size={14} />
                    {deletingId === group.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
