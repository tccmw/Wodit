import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`rain-glass-card ${className}`}>{children}</div>;
}
