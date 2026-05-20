"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Shield, Users } from "lucide-react";

type Account = {
  role: "talebe" | "mentor" | "uniteci" | "admin";
} | null;

type Session = {
  account: Account;
  leader: unknown | null;
};

type Tab = { href: string; label: string; icon: React.ReactNode };

export function TabBar({
  tabs,
}: {
  tabs: Tab[];
}) {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        setSession({ account: data.account ?? null, leader: data.leader ?? null });
      } catch {
        setSession({ account: null, leader: null });
      }
    })();
  }, []);

  const extraTabs = useMemo<Tab[]>(() => {
    const role = session?.account?.role;
    const items: Tab[] = [];
    const hasGroupAccess =
      Boolean(session?.leader) ||
      role === "mentor" ||
      role === "uniteci" ||
      role === "admin";

    if (hasGroupAccess) {
      items.push({
        href: "/leader",
        label: "My group",
        icon: <Users size={16} />,
      });
    }
    if (role === "uniteci" || role === "admin") {
      items.push({
        href: "/panel",
        label: "My unite",
        icon: <Building2 size={16} />,
      });
    }
    if (role === "admin") {
      items.push({
        href: "/panel",
        label: "Admin panel",
        icon: <Shield size={16} />,
      });
    }

    return items.filter(
      (item) => !tabs.some((tab) => tab.href === item.href && tab.label === item.label)
    );
  }, [session, tabs]);

  const allTabs = [...tabs, ...extraTabs];

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40">
      <div className="glass-strong rounded-full px-2 py-2 flex items-center gap-1 shadow-glass-lg max-w-[calc(100vw-1rem)] overflow-x-auto">
        {allTabs.map((t) => {
          const active =
            pathname === t.href ||
            (t.href === "/leader" && pathname.startsWith("/leader/")) ||
            (t.href !== "/student/today" && pathname.startsWith(`${t.href}/`));
          return (
            <Link
              key={`${t.href}-${t.label}`}
              href={t.href}
              className={`tap flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                active
                  ? "bg-mocha-600 text-cream-50"
                  : "text-mocha-600 hover:bg-cream-200/60"
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
