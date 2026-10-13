"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Package, ShoppingBag, Tag, User } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

// The five most frequent tasks: browse, stock, sell, follow purchases/sales, account.
const items = [
  { href: "/market", label: "Mercado", icon: ShoppingBag },
  { href: "/inventory", label: "Inventario", icon: Layers },
  { href: "/listings", label: "Ventas", icon: Tag },
  { href: "/transactions", label: "Operaciones", icon: Package },
  { href: "/account", label: "Cuenta", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  // Listing pages pin their own buy bar to the bottom.
  if (pathname && /^\/market\/[^/]+$/.test(pathname)) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-3 bottom-3 z-30 safe-pb md:hidden"
    >
      <ul className="glass mx-auto flex max-w-md">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                  active
                    ? "text-[var(--accent-hi)]"
                    : "text-[var(--ink-mute)] hover:text-[var(--ink)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent-hi)]"
                  />
                )}
                <Icon
                  className={cn("h-5 w-5 transition-transform", active && "scale-110")}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
