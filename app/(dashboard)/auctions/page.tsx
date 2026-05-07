import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gavel } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function AuctionsPage() {
  const user = await getAuthenticatedUser();

  return (
    <section className="space-y-5">
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">Formato pausado</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Subastas
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Las subastas estan pausadas por ahora. La plataforma queda enfocada en
          mercado directo, trades y cobros con Mercado Pago.
        </p>
      </Card>

      <Card padding="lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[var(--radius-card)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-h3">No hay subastas activas</h2>
              <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">
                Evitamos mostrar una experiencia que todavia no esta conectada a la base actual.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/market">Ir al mercado</Link>
            </Button>
            {user ? (
              <Button asChild variant="secondary">
                <Link href="/inventory">Cargar cartas</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    </section>
  );
}
