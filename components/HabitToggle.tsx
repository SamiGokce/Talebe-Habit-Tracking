"use client";

import { Check } from "lucide-react";

export function HabitToggle({
  label,
  hint,
  done,
  onToggle,
  icon,
}: {
  label: string;
  hint?: string;
  done: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onToggle}
      className={`tap w-full rounded-2xl px-4 py-3 flex items-center justify-between border transition text-left ${
        done
          ? "bg-accent-sage/12 border-accent-sage/30 done-glow"
          : "bg-cream-100/60 border-cream-300/60"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-mocha-500">{icon}</span>}
        <div>
          <div
            className={`font-medium ${
              done ? "text-mocha-700" : "text-mocha-500"
            }`}
          >
            {label}
          </div>
          {hint && <div className="text-xs text-mocha-400">{hint}</div>}
        </div>
      </div>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
          done
            ? "bg-accent-sage text-white"
            : "bg-cream-200/80 text-mocha-400 border border-cream-300"
        }`}
      >
        {done && <Check size={16} strokeWidth={3} />}
      </div>
    </button>
  );
}
