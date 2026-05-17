"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    block?: boolean;
  }
>(function Button(
  { variant = "primary", block, className = "", children, ...rest },
  ref
) {
  const base =
    "tap inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-medium text-base transition disabled:opacity-50 disabled:cursor-not-allowed";
  const sizing = block ? "w-full" : "";
  const styles: Record<Variant, string> = {
    primary:
      "bg-mocha-600 text-cream-50 hover:bg-mocha-700 shadow-soft",
    secondary:
      "glass-strong text-mocha-700 hover:bg-cream-100/80",
    ghost: "text-mocha-700 hover:bg-cream-200/50",
    danger:
      "bg-accent-rose/90 text-white hover:bg-accent-rose shadow-soft",
  };
  return (
    <button
      ref={ref}
      className={`${base} ${sizing} ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
