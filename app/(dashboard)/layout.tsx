import Link from "next/link";

const links = [
  { href: "/inventory", label: "Inventario" },
  { href: "/listings", label: "Listings" },
  { href: "/market", label: "Mercado" },
];

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:py-8">
      <header className="surface-panel mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-black/55">
            TCG Seller Console
          </p>
          <p className="text-lg font-semibold text-[var(--color-accent-strong)]">
            Panel operativo MVP
          </p>
        </div>

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
      </header>

      {children}
    </div>
  );
}