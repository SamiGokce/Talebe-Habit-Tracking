import { type HTMLAttributes } from "react";

type Variant = "default" | "strong" | "soft";

export function GlassCard({
  variant = "default",
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  const v =
    variant === "strong"
      ? "glass-strong"
      : variant === "soft"
        ? "glass-soft"
        : "glass";
  return (
    <div
      className={`${v} rounded-3xl ${className}`}
      {...rest}
    />
  );
}
