import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 md:py-10">
      <div className="flex items-center justify-between text-sm">
        <Link href="/" className="font-semibold text-[var(--color-accent-strong)]">
          TCG Marketplace AR
        </Link>
        <Link
          href="/market"
          className="rounded-full border border-[var(--color-border)] px-4 py-2 hover:bg-white/60"
        >
          Ver mercado
        </Link>
      </div>
      {children}
    </div>
  );
}