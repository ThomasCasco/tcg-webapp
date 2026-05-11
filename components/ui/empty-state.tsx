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
    <div className={cn(
      "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white p-8 text-center md:p-12",
      className
    )}>
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-ink-subtle)]">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
        {description && (
          <div className="max-w-sm text-sm text-[var(--color-ink-muted)]">{description}</div>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
