import { cn } from "@/lib/ui/cn";

const variantClasses = {
  text: "h-4 w-full",
  card: "h-32 w-full rounded-[var(--r-md)]",
  avatar: "h-10 w-10 rounded-full",
  image: "aspect-[3/4] w-full rounded-[var(--r-md)]",
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
      className={cn("skeleton", variantClasses[variant], className)}
    />
  );
}
