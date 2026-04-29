import { cn } from "@/lib/ui/cn";

const variantClasses = {
  text: "h-4 w-full rounded-md",
  card: "h-32 w-full rounded-[var(--radius-card)]",
  avatar: "h-10 w-10 rounded-full",
  image: "aspect-[3/4] w-full rounded-lg",
} as const;

export function Skeleton({
  variant = "text",
  className,
}: {
  variant?: keyof typeof variantClasses;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn(
        "animate-pulse bg-[var(--color-border-subtle)]",
        variantClasses[variant],
        className
      )}
    />
  );
}
