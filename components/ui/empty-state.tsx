import * as React from "react";
import { cn } from "@/lib/ui/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  image,
  imageAlt = "",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass-soft flex flex-col items-center justify-center gap-3 px-4 py-12 text-center",
        className,
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={imageAlt}
          className="mb-1 h-32 w-32 opacity-70"
          loading="lazy"
        />
      ) : icon ? (
        <div className="text-[var(--ink-soft)]">{icon}</div>
      ) : null}
      <p className="t-h3">{title}</p>
      {description && <div className="max-w-sm t-sm t-mute">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
