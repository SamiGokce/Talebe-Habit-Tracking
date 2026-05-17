"use client";

import { Check, Users } from "lucide-react";

export function PrayerRow({
  label,
  done,
  cemaat,
  onToggleDone,
  onToggleCemaat,
}: {
  label: string;
  done: boolean;
  cemaat: boolean;
  onToggleDone: () => void;
  onToggleCemaat: () => void;
}) {
  return (
    <div
      className={`tap rounded-2xl px-4 py-3 flex items-center justify-between border transition ${
        done
          ? "bg-accent-sage/12 border-accent-sage/30 done-glow"
          : "bg-cream-100/60 border-cream-300/60"
      }`}
    >
      <button
        onClick={onToggleDone}
        className="flex items-center gap-3 flex-1 text-left"
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
            done
              ? "bg-accent-sage text-white"
              : "bg-cream-200/80 text-mocha-400 border border-cream-300"
          }`}
        >
          {done && <Check size={16} strokeWidth={3} />}
        </div>
        <span
          className={`font-medium ${
            done ? "text-mocha-700" : "text-mocha-500"
          }`}
        >
          {label}
        </span>
      </button>
      <button
        onClick={onToggleCemaat}
        disabled={!done}
        className={`tap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
          cemaat
            ? "bg-mocha-600 text-cream-50"
            : "bg-cream-200/70 text-mocha-500 disabled:opacity-40"
        }`}
        aria-label={`${label} cemaat`}
        title="Cemaat (congregation)"
      >
        <Users size={13} />
        Cemaat
      </button>
    </div>
  );
}
