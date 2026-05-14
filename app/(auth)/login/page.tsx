import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";
import { ShoppingBag } from "@/components/ui/icon";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/inventory");
  }

  return (
    <div className="grid min-h-svh place-items-center bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface-elevated)] to-[var(--color-accent-soft)]/40 p-4">
      <Card
        as="section"
        padding="lg"
        className="w-full max-w-md border-[var(--color-border-strong)] shadow-[var(--shadow-card-lg)]"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-body-sm font-bold text-[var(--color-ink)]"
        >
          <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-input)] bg-[var(--color-ink)] text-[var(--color-ink-inverse)]">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <span className="[font-family:var(--font-display)] text-h3">TCG.ar</span>
        </Link>

        <p className="mt-6 text-overline text-[var(--color-ink-subtle)]">
          Bienvenido de vuelta
        </p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">Iniciar sesión</h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Gestioná tu inventario, publicaciones y transacciones.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </Card>
    </div>
  );
}
