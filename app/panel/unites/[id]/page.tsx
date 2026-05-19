"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap, Users } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

type Unite = {
  id: string;
  name: string;
  description: string | null;
  uniteci_name: string | null;
};

type Group = {
  id: string;
  code: string;
  name: string;
  school_level: string;
  mentor_name: string | null;
  mentor_account_name: string | null;
  student_count: number;
};

export default function UniteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [unite, setUnite] = useState<Unite | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      if (!meData.account) {
        router.push(`/account?next=/panel/unites/${params.id}`);
        return;
      }
      if (!["admin", "uniteci"].includes(meData.account.role)) {
        router.push("/");
        return;
      }

      const res = await fetch(`/api/panel/unites/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load unite.");
        setLoading(false);
        return;
      }
      setUnite(data.unite);
      setGroups(data.groups || []);
      setLoading(false);
    })();
  }, [params.id, router]);

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
          href="/panel"
          className="tap inline-flex items-center gap-1 text-mocha-500 text-sm mb-6"
        >
          <ArrowLeft size={16} /> Back to unites
        </Link>

        {error || !unite ? (
          <GlassCard className="p-6 text-mocha-500">
            {error || "Unite not found."}
          </GlassCard>
        ) : (
          <>
            <div className="mb-5">
              <h1 className="font-display text-3xl font-semibold text-mocha-700">
                {unite.name}
              </h1>
              <p className="text-sm text-mocha-500">
                Uniteci: {unite.uniteci_name || "Unassigned"}
              </p>
            </div>

            {groups.length === 0 ? (
              <GlassCard className="p-8 text-center text-mocha-500">
                No groups in this unite yet.
              </GlassCard>
            ) : (
              <div className="flex flex-col gap-2">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/panel/groups/${group.id}`}
                    className="tap glass-strong rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-mocha-700">
                        {group.name}
                      </div>
                      <div className="text-xs text-mocha-400">
                        {group.code} / {group.school_level.replace("_", " ")}
                      </div>
                      <div className="text-xs text-mocha-400">
                        Mentor: {group.mentor_account_name || group.mentor_name || "Unassigned"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-mocha-500">
                      <Users size={16} /> {group.student_count}
                      <GraduationCap size={16} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
