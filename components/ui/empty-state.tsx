import * as React from "react";
import { cn } from "@/lib/ui/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("glass-soft flex flex-col items-center justify-center gap-3 px-4 py-12 text-center", className)}>
      {icon && <div className="text-[var(--ink-soft)]">{icon}</div>}
      <p className="t-h3">{title}</p>
      {description && (
        <div className="max-w-sm t-sm t-mute">{description}</div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
