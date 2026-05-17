"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header({
  title,
  subtitle,
  right,
  logoutPath,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  logoutPath?: "student" | "group";
}) {
  const router = useRouter();
  const logout = async () => {
    if (!logoutPath) return;
    const endpoint =
      logoutPath === "student"
        ? "/api/students/logout"
        : "/api/groups/logout";
    await fetch(endpoint, { method: "POST" });
    router.push("/");
  };
  return (
    <header className="sticky top-0 z-30 px-4 pt-3 pb-2">
      <div className="glass-strong rounded-full px-5 py-2.5 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-mocha-700 font-display text-lg font-semibold">
            {title}
          </span>
          {subtitle && (
            <span className="text-mocha-400 text-sm">· {subtitle}</span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          {right}
          {logoutPath && (
            <button
              onClick={logout}
              className="tap p-2 rounded-full hover:bg-cream-200/60 text-mocha-500"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
