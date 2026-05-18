"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export default function LeaderEntryPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "create">("login");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [schoolLevel, setSchoolLevel] = useState<
    "middle_school" | "high_school" | "mixed"
  >("middle_school");
  const [mentorName, setMentorName] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ code: string; name: string } | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (data.leader) router.push("/leader/dashboard");
    })();
  }, [router]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/groups/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, passphrase }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not sign in.");
      setLoading(false);
      return;
    }
    router.push("/leader/dashboard");
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/groups/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        passphrase,
        school_level: schoolLevel,
        mentor_name: mentorName,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create group.");
      setLoading(false);
      return;
    }
    setCreated({ code: data.group.code, name: data.group.name });
    setLoading(false);
  }

  if (created) {
    return (
      <main className="min-h-screen px-4 py-6 flex flex-col items-center">
        <div className="w-full max-w-md">
          <div className="glass-strong rounded-3xl p-7 animate-slide-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-accent-sage/15 text-accent-sage flex items-center justify-center mx-auto mb-4">
              <Users size={26} />
            </div>
            <h1 className="font-display text-3xl font-semibold text-mocha-700">
              {created.name}
            </h1>
            <p className="text-mocha-500 mt-2">
              Share this code with your students:
            </p>
            <div className="my-4 inline-block bg-cream-100/70 border border-mocha-200 rounded-2xl px-6 py-4">
              <div className="font-display text-4xl tracking-widest font-semibold text-mocha-700">
                {created.code}
              </div>
            </div>
            <p className="text-xs text-mocha-400 mb-5">
              Keep your passphrase safe - you'll use it to sign back in.
            </p>
            <Button block onClick={() => router.push("/leader/dashboard")}>
              Open dashboard →
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="tap inline-flex items-center gap-1 text-mocha-500 text-sm mb-6"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="glass-strong rounded-3xl p-7 animate-slide-up">
          <div className="w-12 h-12 rounded-2xl bg-mocha-200/60 text-mocha-600 flex items-center justify-center mb-4">
            <Users size={26} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-mocha-700">
            Mentor access
          </h1>
          <p className="text-mocha-500 mt-1 mb-5">
            {mode === "login"
              ? "Sign in to your group."
              : "Start a new group for your students."}
          </p>

          <div className="glass-soft rounded-2xl p-1 mb-5 flex">
            {(["login", "create"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium tap transition ${
                  mode === m
                    ? "bg-mocha-600 text-cream-50"
                    : "text-mocha-500"
                }`}
              >
                {m === "login" ? "Sign in" : "Create group"}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <form onSubmit={onLogin} className="flex flex-col gap-4">
              <Input
                label="Group code"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                  )
                }
                placeholder="e.g. AB7K2P"
                maxLength={8}
                autoCapitalize="characters"
                spellCheck={false}
                required
              />
              <Input
                label="Mentor passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Your group's passphrase"
                required
              />
              {error && (
                <div className="text-sm text-accent-rose bg-accent-rose/10 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}
              <Button type="submit" block disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={onCreate} className="flex flex-col gap-4">
              <Input
                label="Group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Halaqa Cumartesi"
                required
              />
              <Input
                label="Mentor name"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                placeholder="Shown on the mentor dashboard"
              />
              <div>
                <div className="text-sm font-medium text-mocha-600 mb-1.5">
                  Group level
                </div>
                <div className="glass-soft rounded-2xl p-1 flex">
                  {[
                    ["middle_school", "Middle"],
                    ["high_school", "High"],
                    ["mixed", "Mixed"],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() =>
                        setSchoolLevel(
                          value as "middle_school" | "high_school" | "mixed"
                        )
                      }
                      className={`flex-1 py-2 rounded-xl text-sm font-medium tap transition ${
                        schoolLevel === value
                          ? "bg-mocha-600 text-cream-50"
                          : "text-mocha-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="Mentor passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="At least 4 characters"
                minLength={4}
                required
              />
              {error && (
                <div className="text-sm text-accent-rose bg-accent-rose/10 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}
              <Button type="submit" block disabled={loading}>
                {loading ? "Creating…" : "Create group"}
              </Button>
              <p className="text-xs text-mocha-400">
                Anyone with the group code + passphrase can manage members and
                contests.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
