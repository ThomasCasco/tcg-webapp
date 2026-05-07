"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowLeftRight, Gavel, Layers, Tag } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

const items = [
  { href: "/market", label: "Mercado", icon: ShoppingBag },
  { href: "/trades", label: "Trades", icon: ArrowLeftRight },
  { href: "/auctions", label: "Subastas", icon: Gavel },
  { href: "/inventory", label: "Inventario", icon: Layers },
  { href: "/listings", label: "Ventas", icon: Tag },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border-default)] bg-[var(--color-surface-elevated)]/95 backdrop-blur safe-pb md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
                  active
                    ? "text-[var(--color-accent-strong)]"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                {/* Active indicator pill */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-1.5 h-1 w-8 rounded-full bg-[var(--color-accent)]"
                  />
                )}
                <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
