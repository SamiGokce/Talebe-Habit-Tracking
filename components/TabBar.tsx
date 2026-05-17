"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TabBar({
  tabs,
}: {
  tabs: { href: string; label: string; icon: React.ReactNode }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40">
      <div className="glass-strong rounded-full px-2 py-2 flex items-center gap-1 shadow-glass-lg">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
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
