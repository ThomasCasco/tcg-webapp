"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowLeftRight, Layers, Tag } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

const items = [
  { href: "/market", label: "Mercado", icon: ShoppingBag },
  { href: "/trades", label: "Trades", icon: ArrowLeftRight },
  { href: "/inventory", label: "Inventario", icon: Layers },
  { href: "/listings", label: "Ventas", icon: Tag },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-3 bottom-3 z-30 safe-pb md:hidden"
    >
      <ul className="glass mx-auto flex max-w-md [background:linear-gradient(180deg,rgba(20,28,52,0.78),rgba(8,12,28,0.92))]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
                  active
                    ? "text-[var(--accent-hi)]"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent-hi)] [box-shadow:0_0_10px_var(--accent-hi)]"
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
