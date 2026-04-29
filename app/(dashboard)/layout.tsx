import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { NotificationsBell } from "@/components/notifications-bell";
import { SidebarNav } from "@/components/sidebar-nav";
import { getAuthenticatedUser } from "@/lib/server/auth";

const links = [
  { href: "/market", label: "Mercado", icon: "🛒" },
  { href: "/inventory", label: "Inventario", icon: "📦" },
  { href: "/listings", label: "Publicaciones", icon: "🏷️" },
  { href: "/transactions", label: "Operaciones", icon: "🔄" },
  { href: "/disputes", label: "Disputas", icon: "⚖️" },
  { href: "/alerts", label: "Alertas", icon: "🔔" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex md:flex-col">
        <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-accent)] text-lg font-bold text-white shadow-sm">
              T
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">TCG Market</p>
              <p className="text-[10px] uppercase tracking-[0.15em] subtle">Panel</p>
            </div>
          </Link>
        </div>

        <SidebarNav links={links} />

        <div className="border-t border-[var(--color-border)] px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-accent-soft)] text-sm font-bold text-[var(--color-accent-ink)]">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.username}</p>
              <p className="truncate text-[10px] subtle">Vendedor</p>
            </div>
          </div>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2.5 md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-accent)] text-sm font-bold text-white">
                T
              </div>
              <span className="text-sm font-bold tracking-tight">TCG Market</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <p className="text-xs subtle">Hola, {user.username} 👋</p>
            <p className="text-sm font-semibold">Gestioná tu inventario y ventas</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <div className="md:hidden">
              <LogoutButton compact />
            </div>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)]"
            >
              <span aria-hidden>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
