"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Save, Sparkles, Trash2, Users } from "lucide-react";
import { Button } from "@/components/Button";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/Input";
import { formatDate } from "@/lib/date-format";

type Group = {
  id: string;
  code: string;
  name: string;
  school_level: string;
  mentor_name: string | null;
  mentor_user_id: string | null;
  mentor_account_name: string | null;
  unite_id: string | null;
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

type Student = {
  id: string;
  display_name: string;
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

export default function PanelGroupPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [unites, setUnites] = useState<UniteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [mentorUserId, setMentorUserId] = useState("");
  const [uniteId, setUniteId] = useState("");

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.account) {
        router.push(`/account?next=/panel/groups/${params.id}`);
        return;
      }
      if (!["admin", "uniteci"].includes(meData.account.role)) {
        router.push("/");
        return;
      }

      const res = await fetch(`/api/panel/groups/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load group.");
        setLoading(false);
        return;
      }
      setGroup(data.group);
      setStudents(data.students || []);
      setMentors(data.mentors || []);
      setUnites(data.unites || []);
      setGroupName(data.group.name || "");
      setMentorName(data.group.mentor_name || "");
      setMentorUserId(data.group.mentor_user_id || "");
      setUniteId(data.group.unite_id || "");
      setLoading(false);
    })();
  }, [params.id, router]);

  async function saveGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!group || saving) return;

    setSaving(true);
    setError(null);
    const res = await fetch(`/api/panel/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: groupName,
        mentor_name: mentorName,
        mentor_user_id: mentorUserId || null,
        unite_id: uniteId,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save group.");
      setSaving(false);
      return;
    }

    const selectedUnite = unites.find((u) => u.id === uniteId);
    const selectedMentor = mentors.find((m) => m.id === mentorUserId);
    setGroup((prev) =>
      prev
        ? {
            ...prev,
            name: groupName,
            mentor_name: mentorName || null,
            mentor_user_id: mentorUserId || null,
            mentor_account_name: selectedMentor?.display_name || null,
            unite_id: uniteId || null,
            unite_name: selectedUnite?.name || null,
          }
        : prev
    );
    setSaving(false);
  }

  async function deleteGroup() {
    if (!group || deleting) return;
    const confirmed = window.confirm(
      `Delete ${group.name}? This will remove the group, its students, and their progress.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/panel/groups/${group.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete group.");
      setDeleting(false);
      return;
    }

    router.push(group.unite_id ? `/panel/unites/${group.unite_id}` : "/panel");
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
          href={group?.unite_id ? `/panel/unites/${group.unite_id}` : "/panel"}
          className="tap inline-flex items-center gap-1 text-mocha-500 text-sm mb-6"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        {error || !group ? (
          <GlassCard className="p-6 text-mocha-500">
            {error || "Group not found."}
          </GlassCard>
        ) : (
          <>
            <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl font-semibold text-mocha-700">
                  {group.name}
                </h1>
                <p className="text-sm text-mocha-500">
                  {group.unite_name || "No unite"} / {group.code}
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={deleteGroup}
                disabled={deleting}
                className="self-start"
              >
                <Trash2 size={16} />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>

            <GlassCard className="p-5 mb-5">
              <div className="flex items-center gap-2 mb-4 text-mocha-700">
                <Save size={18} />
                <h2 className="font-display text-xl font-semibold">
                  Group settings
                </h2>
              </div>
              <form onSubmit={saveGroup} className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
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
                    {unites.map((unite) => (
                      <option key={unite.id} value={unite.id}>
                        {unite.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Mentor display name"
                  value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)}
                  placeholder="Shown to members"
                />
                <div>
                  <div className="text-sm font-medium text-mocha-600 mb-1.5">
                    Mentor account
                  </div>
                  <select
                    value={mentorUserId}
                    onChange={(e) => setMentorUserId(e.target.value)}
                    className="w-full glass-strong rounded-2xl px-4 py-3 text-base text-mocha-800 outline-none"
                  >
                    <option value="">No mentor account</option>
                    {mentors.map((mentor) => (
                      <option key={mentor.id} value={mentor.id}>
                        {mentor.display_name} ({mentor.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving}>
                    <Save size={16} />
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </GlassCard>

            {students.length === 0 ? (
              <GlassCard className="p-8 text-center text-mocha-500">
                No students in this group yet.
              </GlassCard>
            ) : (
              <div className="flex flex-col gap-2">
                {students.map((student) => {
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
                      className="tap glass-strong rounded-2xl p-4 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-mocha-700">
                          {student.display_name}
                        </div>
                        <div className="text-xs text-mocha-400">
                          {student.last_entry_date
                            ? `Last entry: ${formatDate(student.last_entry_date)}`
                            : "No entries yet"}
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 text-xs text-mocha-500">
                        <span className="bg-cream-200/80 rounded-full px-2.5 py-1 inline-flex items-center gap-1">
                          <Users size={12} /> {prayers}/5
                        </span>
                        <span className="bg-cream-200/80 rounded-full px-2.5 py-1 inline-flex items-center gap-1">
                          <BookOpen size={12} /> {student.quran_pages || 0}
                        </span>
                        <span className="bg-cream-200/80 rounded-full px-2.5 py-1 inline-flex items-center gap-1">
                          <Sparkles size={12} /> {student.zikr_count || 0}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
