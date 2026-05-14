import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/server/auth";

export default async function NotFound() {
  const user = await getAuthenticatedUser();
  return (
    <div className="premium-page flex min-h-svh flex-col">
      <TopBar user={user ? { username: user.username, email: user.email } : null} />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-md text-center">
          <p className="text-overline text-[var(--color-ink-subtle)]">Error 404</p>
          <h1 className="mt-2 text-h1 [font-family:var(--font-display)]">
            Pagina no encontrada
          </h1>
          <p className="mt-3 text-body-sm text-[var(--color-ink-muted)]">
            La pagina que buscas no existe o fue movida.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/market">Ir al mercado</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
