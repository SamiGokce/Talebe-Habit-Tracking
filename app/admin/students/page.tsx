"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Filter,
  Sparkles,
  Users,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/Input";

type Student = {
  id: string;
  display_name: string;
  created_at: string;
  group_id: string;
  group_name: string;
  group_code: string;
  unite_id: string | null;
  unite_name: string | null;
  account_email: string | null;
  account_name: string | null;
  last_entry_date: string | null;
  fajr: boolean | null;
  dhuhr: boolean | null;
  asr: boolean | null;
  maghrib: boolean | null;
  isha: boolean | null;
  quran_pages: number | null;
  zikr_count: number | null;
  book_pages: number | null;
};

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [uniteFilter, setUniteFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.account) {
        router.push("/account?next=/admin/students");
        return;
      }
      if (meData.account.role !== "admin") {
        router.push("/");
        return;
      }

      const res = await fetch("/api/admin/students");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load students.");
        setLoading(false);
        return;
      }
      setStudents(data.students || []);
      setLoading(false);
    })();
  }, [router]);

  const unites = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student) => {
      if (student.unite_id) {
        map.set(student.unite_id, student.unite_name || "Unnamed unite");
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [students]);

  const groups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; unite_id: string | null }>();
    students.forEach((student) => {
      if (
        uniteFilter === "all" ||
        (uniteFilter === "none" && !student.unite_id) ||
        student.unite_id === uniteFilter
      ) {
        map.set(student.group_id, {
          id: student.group_id,
          name: student.group_name,
          unite_id: student.unite_id,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, uniteFilter]);

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    return students.filter((student) => {
      const haystack = [
        student.display_name,
        student.account_email,
        student.account_name,
        student.group_name,
        student.group_code,
        student.unite_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesUnite =
        uniteFilter === "all" ||
        (uniteFilter === "none" && !student.unite_id) ||
        student.unite_id === uniteFilter;
      const matchesGroup =
        groupFilter === "all" || student.group_id === groupFilter;
      const matchesActivity =
        activityFilter === "all" ||
        (activityFilter === "active" && Boolean(student.last_entry_date)) ||
        (activityFilter === "no_entries" && !student.last_entry_date);
      return matchesSearch && matchesUnite && matchesGroup && matchesActivity;
    });
  }, [activityFilter, groupFilter, query, students, uniteFilter]);

  useEffect(() => {
    if (
      groupFilter !== "all" &&
      !groups.some((group) => group.id === groupFilter)
    ) {
      setGroupFilter("all");
    }
  }, [groupFilter, groups]);

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
          <div className="w-11 h-11 rounded-2xl bg-accent-sky/15 text-accent-sky flex items-center justify-center">
            <Users size={23} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-mocha-700">
              All students
            </h1>
            <p className="text-sm text-mocha-500">
              {filteredStudents.length} of {students.length} students shown
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-accent-rose bg-accent-rose/10 rounded-xl px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <GlassCard className="p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_170px_170px_150px] gap-3">
            <Input
              label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, email, group, unite"
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
                Group
              </div>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full glass-strong rounded-2xl px-4 py-3 text-base text-mocha-800 outline-none"
              >
                <option value="all">All groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-sm font-medium text-mocha-600 mb-1.5">
                Entries
              </div>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-full glass-strong rounded-2xl px-4 py-3 text-base text-mocha-800 outline-none"
              >
                <option value="all">Any status</option>
                <option value="active">Has entries</option>
                <option value="no_entries">No entries</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {filteredStudents.length === 0 ? (
          <GlassCard className="p-8 text-center text-mocha-500">
            No students match these filters.
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredStudents.map((student) => {
              const prayers = [
                student.fajr,
                student.dhuhr,
                student.asr,
                student.maghrib,
                student.isha,
              ].filter(Boolean).length;

              return (
                <Link
                  key={student.id}
                  href={`/panel/students/${student.id}`}
                  className="tap glass-strong rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-mocha-700">
                      {student.display_name}
                    </div>
                    <div className="text-xs text-mocha-400">
                      {student.unite_name || "No unite"} / {student.group_name}
                    </div>
                    <div className="text-xs text-mocha-400">
                      {student.account_email || "No account email"}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-start sm:justify-end gap-2 text-xs text-mocha-500">
                    <span className="bg-cream-200/80 rounded-full px-2.5 py-1 inline-flex items-center gap-1">
                      <Users size={12} /> {prayers}/5
                    </span>
                    <span className="bg-cream-200/80 rounded-full px-2.5 py-1 inline-flex items-center gap-1">
                      <BookOpen size={12} /> {student.quran_pages || 0}
                    </span>
                    <span className="bg-cream-200/80 rounded-full px-2.5 py-1 inline-flex items-center gap-1">
                      <Sparkles size={12} /> {student.zikr_count || 0}
                    </span>
                    <span className="bg-cream-200/80 rounded-full px-2.5 py-1">
                      {student.last_entry_date
                        ? `Last ${student.last_entry_date}`
                        : "No entries"}
                    </span>
                    <span className="bg-cream-200/80 rounded-full px-2.5 py-1 inline-flex items-center gap-1">
                      <ExternalLink size={12} /> Open
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
