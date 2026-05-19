"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export default function StudentJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (!data.account) {
        router.push("/account?next=/student/join");
        return;
      }
      if (data.student) {
        router.replace("/student/today");
        return;
      }
      setAccountName(data.account.displayName);
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/students/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not join.");
      setLoading(false);
      return;
    }
    router.push("/student/today");
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
          <div className="w-12 h-12 rounded-2xl bg-accent-sage/15 text-accent-sage flex items-center justify-center mb-4">
            <GraduationCap size={26} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-mocha-700">
            Join your group
          </h1>
          <p className="text-mocha-500 mt-1 mb-6">
            Ask your mentor for the invite code.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              label="Group code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              placeholder="e.g. AB7K2P"
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            {accountName && (
              <div className="glass-soft rounded-2xl px-4 py-3 text-sm text-mocha-500">
                Joining as <span className="font-medium text-mocha-700">{accountName}</span>
              </div>
            )}
            {error && (
              <div className="text-sm text-accent-rose bg-accent-rose/10 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            <Button type="submit" block disabled={loading}>
              {loading ? "Joining…" : "Continue"}
            </Button>
          </form>
          <p className="text-xs text-mocha-400 mt-4">
            Your progress is connected to your account.
          </p>
        </div>
      </div>
    </main>
  );
}
