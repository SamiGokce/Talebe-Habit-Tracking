"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Apple,
  Chrome,
  GraduationCap,
  UserRound,
  Users,
  Building2,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-mocha-500 animate-pulse">Loading...</div>
        </main>
      }
    >
      <AccountForm />
    </Suspense>
  );
}

function AccountForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signupRole, setSignupRole] = useState<"talebe" | "mentor" | "uniteci">(
    "talebe"
  );
  const [roleCode, setRoleCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const signedInTarget = next === "/" ? "/student/today" : next;

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (data.account) {
        router.replace(signedInTarget);
        return;
      }
      setChecking(false);
    })();
  }, [router, signedInTarget]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(
      mode === "login" ? "/api/account/login" : "/api/account/signup",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          requested_role: signupRole,
          role_code: roleCode,
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not continue.");
      setLoading(false);
      return;
    }
    router.replace(data.redirectTo || signedInTarget);
  }

  function oauthHref(provider: "google" | "apple") {
    const params = new URLSearchParams({
      next: signedInTarget,
    });
    if (mode === "signup") {
      params.set("requested_role", signupRole);
      params.set("role_code", roleCode);
      params.set("email", email);
    }
    return `/api/account/oauth/${provider}/start?${params.toString()}`;
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-mocha-500 animate-pulse">Loading...</div>
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
          <div className="w-12 h-12 rounded-2xl bg-accent-sage/15 text-accent-sage flex items-center justify-center mb-4">
            <UserRound size={26} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-mocha-700">
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          <p className="text-mocha-500 mt-1 mb-5">
            Use one account before joining or managing groups.
          </p>

          <div className="grid grid-cols-1 gap-2 mb-5">
            <a
              href={oauthHref("google")}
              className="tap glass-soft rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-mocha-700 font-medium"
            >
              <Chrome size={18} /> Continue with Google
            </a>
            <a
              href={oauthHref("apple")}
              className="tap bg-mocha-800 text-cream-50 rounded-2xl px-4 py-3 flex items-center justify-center gap-2 font-medium"
            >
              <Apple size={18} /> Continue with Apple
            </a>
          </div>

          <div className="flex items-center gap-3 mb-5 text-xs text-mocha-400">
            <span className="h-px flex-1 bg-cream-300/70" />
            <span>Email</span>
            <span className="h-px flex-1 bg-cream-300/70" />
          </div>

          <div className="glass-soft rounded-2xl p-1 mb-5 flex">
            {(["login", "signup"] as const).map((m) => (
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
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <>
                <Input
                  label="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="How mentors know you"
                  required
                />
                <div>
                  <div className="text-sm font-medium text-mocha-600 mb-1.5">
                    Account type
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        value: "talebe",
                        label: "Student",
                        icon: <GraduationCap size={16} />,
                      },
                      {
                        value: "mentor",
                        label: "Mentor",
                        icon: <Users size={16} />,
                      },
                      {
                        value: "uniteci",
                        label: "Uniteci",
                        icon: <Building2 size={16} />,
                      },
                    ].map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => {
                          setSignupRole(option.value as typeof signupRole);
                          setError(null);
                        }}
                        className={`tap rounded-2xl px-2 py-3 flex flex-col items-center gap-1 text-sm font-medium transition ${
                          signupRole === option.value
                            ? "bg-mocha-600 text-cream-50"
                            : "glass-soft text-mocha-600"
                        }`}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {signupRole !== "talebe" && (
                  <Input
                    label={
                      signupRole === "mentor"
                        ? "Mentor signup code"
                        : "Uniteci signup code"
                    }
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value)}
                    placeholder="Enter the in-person code"
                    required
                  />
                )}
              </>
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              minLength={mode === "signup" ? 8 : undefined}
              required
            />
            {error && (
              <div className="text-sm text-accent-rose bg-accent-rose/10 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            <Button type="submit" block disabled={loading}>
              {loading
                ? "Working..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
