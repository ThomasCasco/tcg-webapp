"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Layers, Tag, Package, User } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

const items = [
  { href: "/market", label: "Mercado", icon: ShoppingBag },
  { href: "/inventory", label: "Inventario", icon: Layers },
  { href: "/listings", label: "Mis Ventas", icon: Tag },
  { href: "/transactions", label: "Mis Compras", icon: Package },
  { href: "/account", label: "Cuenta", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] safe-pb md:hidden"
    >
      <ul className="flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem]",
                  active
                    ? "text-[var(--color-accent-strong)]"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
