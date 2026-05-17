"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(function Input({ label, className = "", id, ...rest }, ref) {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-1.5 text-sm font-medium text-mocha-600"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full glass-strong rounded-2xl px-4 py-3 text-base text-mocha-800 placeholder:text-mocha-400 outline-none focus:ring-2 focus:ring-mocha-400/40 transition ${className}`}
        {...rest}
      />
    </div>
  );
});
