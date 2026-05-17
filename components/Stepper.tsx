"use client";

import { Minus, Plus } from "lucide-react";

export function Stepper({
  label,
  hint,
  value,
  onChange,
  step = 1,
  icon,
  unit,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  icon?: React.ReactNode;
  unit?: string;
}) {
  const active = value > 0;
  const dec = () => onChange(Math.max(0, value - step));
  const inc = () => onChange(Math.min(9999, value + step));

  return (
    <div
      className={`rounded-2xl px-4 py-3 flex items-center justify-between border transition ${
        active
          ? "bg-accent-gold/12 border-accent-gold/30 done-glow"
          : "bg-cream-100/60 border-cream-300/60"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-mocha-500">{icon}</span>}
        <div>
          <div
            className={`font-medium ${
              active ? "text-mocha-700" : "text-mocha-500"
            }`}
          >
            {label}
          </div>
          {hint && <div className="text-xs text-mocha-400">{hint}</div>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={dec}
          className="tap w-9 h-9 rounded-full bg-cream-200/80 text-mocha-600 flex items-center justify-center disabled:opacity-40"
          disabled={value === 0}
          aria-label={`Decrease ${label}`}
        >
          <Minus size={16} />
        </button>
        <div className="min-w-[3.5rem] text-center">
          <span className="font-display text-xl font-semibold text-mocha-700 tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-xs text-mocha-400 ml-1">{unit}</span>
          )}
        </div>
        <button
          onClick={inc}
          className="tap w-9 h-9 rounded-full bg-mocha-600 text-cream-50 flex items-center justify-center"
          aria-label={`Increase ${label}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
