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
    <div className={cn("flex flex-col items-center justify-center gap-3 px-4 py-12 text-center", className)}>
      {icon && <div className="text-[var(--color-ink-subtle)]">{icon}</div>}
      <p className="text-h3 text-[var(--color-ink)]">{title}</p>
      {description && (
        <div className="max-w-sm text-[0.875rem] text-[var(--color-ink-muted)]">{description}</div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
