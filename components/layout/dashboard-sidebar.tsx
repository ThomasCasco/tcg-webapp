"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Layers, Tag, Package, Bell, Scale, User } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/ui/cn";

const primary = [
  { href: "/market", label: "Mercado", icon: ShoppingBag },
  { href: "/inventory", label: "Inventario", icon: Layers },
  { href: "/listings", label: "Mis Ventas", icon: Tag },
  { href: "/transactions", label: "Mis Compras", icon: Package },
];

const secondary = [
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/disputes", label: "Disputas", icon: Scale },
  { href: "/account", label: "Cuenta", icon: User },
];

export interface DashboardSidebarProps {
  username: string;
  logoutSlot: React.ReactNode;
}

export function DashboardSidebar({ username, logoutSlot }: DashboardSidebarProps) {
  const pathname = usePathname();

  const renderLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = pathname?.startsWith(href);
    return (
      <li key={href}>
        <Link
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-input)] px-3 py-2 text-[0.9375rem] transition-colors",
            active
              ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
              : "text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)]"
          )}
          aria-current={active ? "page" : undefined}
        >
          <Icon className="h-4 w-4" aria-hidden />
          <span>{label}</span>
        </Link>
      </li>
    );
  };

  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:gap-6 md:border-r md:border-[var(--color-border-subtle)] md:bg-[var(--color-surface-elevated)] md:px-4 md:py-6">
      <Link href="/market" className="text-h2 font-bold text-[var(--color-accent-strong)]">
        TCG Market
      </Link>
      <nav aria-label="Navegación principal" className="flex flex-col gap-6">
        <ul className="flex flex-col gap-1">{primary.map(renderLink)}</ul>
        <div>
          <p className="mb-1 px-3 text-overline text-[var(--color-ink-subtle)]">Más</p>
          <ul className="flex flex-col gap-1">{secondary.map(renderLink)}</ul>
        </div>
      </nav>
      <div className="mt-auto flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] p-3">
        <Avatar name={username} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.875rem] font-semibold text-[var(--color-ink)]">{username}</p>
          {logoutSlot}
        </div>
      </div>
    </aside>
  );
}
