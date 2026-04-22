import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { NotificationsBell } from "@/components/notifications-bell";
import { getAuthenticatedUser } from "@/lib/server/auth";

const links = [
  { href: "/inventory", label: "Inventario" },
  { href: "/listings", label: "Publicaciones" },
  { href: "/transactions", label: "Transacciones" },
  { href: "/disputes", label: "Disputas" },
  { href: "/market", label: "Mercado" },
];

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const userPromise = getAuthenticatedUser();

  return <DashboardLayoutInner userPromise={userPromise}>{children}</DashboardLayoutInner>;
}

async function DashboardLayoutInner({
  children,
  userPromise,
}: Readonly<{ children: React.ReactNode; userPromise: ReturnType<typeof getAuthenticatedUser> }>) {
  const user = await userPromise;
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:py-8">
      <header className="surface-panel mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-black/55">
            Panel de vendedor
          </p>
          <p className="text-lg font-semibold text-[var(--color-accent-strong)]">
            Hola, {user.username}
          </p>
          <p className="text-sm text-black/65">
            Cargá cartas en <strong>Inventario</strong> y publicalas en <strong>Mercado</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <nav className="flex flex-wrap gap-2 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-[var(--color-border)] px-4 py-2 hover:bg-white/70"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <NotificationsBell />
          <LogoutButton />
        </div>
      </header>

      {children}
    </div>
  );
}