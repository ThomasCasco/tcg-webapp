"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Layers,
  Tag,
  Package,
  Bell,
  Scale,
  Wallet,
  Home,
  Info,
} from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

type NavSection = {
  label: string;
  items: Array<{
    href: string;
    label: string;
    icon: React.ElementType;
  }>;
};

const sections: NavSection[] = [
  {
    label: "Inicio",
    items: [
      { href: "/dashboard", label: "Resumen", icon: Home },
      { href: "/how-it-works", label: "Cómo funciona", icon: Info },
    ],
  },
  {
    label: "Comprar",
    items: [
      { href: "/market", label: "Mercado", icon: ShoppingBag },
      { href: "/transactions", label: "Compras y ventas", icon: Package },
    ],
  },
  {
    label: "Vender",
    items: [
      { href: "/inventory", label: "Inventario", icon: Layers },
      { href: "/listings", label: "Mis publicaciones", icon: Tag },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { href: "/alerts", label: "Alertas", icon: Bell },
      { href: "/disputes", label: "Disputas", icon: Scale },
      { href: "/account", label: "Cuenta y cobros", icon: Wallet },
    ],
  },
];

export interface DashboardSidebarProps {
  username?: string;
  logoutSlot?: React.ReactNode;
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:sticky md:top-16 md:flex md:h-[calc(100svh-4rem)] md:w-64 md:shrink-0 md:flex-col md:gap-6 md:overflow-y-auto md:border-r md:border-[var(--hairline)] md:px-4 md:py-6">
      <nav aria-label="Navegación principal" className="flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 t-eyebrow">{section.label}</p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname?.startsWith(href + "/");
                return (
                  <li key={`${section.label}-${href}-${label}`}>
                    <Link
                      href={href}
                      className={cn(
                        "group flex items-center gap-3 rounded-[var(--r-sm)] px-3 py-2 text-[0.9375rem] transition-colors",
                        active
                          ? "[background:rgba(var(--accent-glow),0.15)] border border-[rgba(var(--accent-glow),0.3)] font-semibold text-[var(--accent-hi)]"
                          : "border border-transparent text-[var(--ink-mute)] hover:bg-white/5 hover:text-[var(--ink)]"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active
                            ? "text-[var(--accent-hi)]"
                            : "text-[var(--ink-soft)] group-hover:text-[var(--ink)]"
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
