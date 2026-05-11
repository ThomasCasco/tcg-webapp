import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import {
  listAuctions,
  listInventoryEntries,
} from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { AuctionCreateForm } from "@/components/auction-create-form";
import { AuctionListingCard } from "@/components/auction-listing-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarClock, Gavel } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function AuctionsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  if (!isSupabaseConfigured()) {
    return (
      <section className="space-y-5">
        <Card padding="lg">
          <p className="text-overline text-[var(--color-ink-subtle)]">Subastas</p>
          <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
            Subastas
          </h1>
          <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
            Configurá Supabase para activar las subastas.
          </p>
        </Card>
      </section>
    );
  }

  const [mineAuctions, inventory] = await Promise.all([
    listAuctions({ sellerId: user.id, viewerUserId: user.id }),
    listInventoryEntries({ ownerId: user.id }),
  ]);

  const scheduled = mineAuctions.filter((auction) => auction.status === "scheduled");
  const active = mineAuctions.filter((auction) => auction.status === "active");
  const closed = mineAuctions.filter((auction) =>
    ["ended", "cancelled", "settled"].includes(auction.status),
  );

  return (
    <section className="space-y-5">
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">Subastas</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Mis subastas
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Programá una subasta para que tus seguidores se anoten y reciban aviso,
          o lanzala ya mismo. Los pagos siguen el mismo flujo del marketplace
          (Mercado Pago automático si lo tenés conectado, o coordinación P2P).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/auctions">
              <Gavel className="h-4 w-4" />
              Ver subastas públicas
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/how-it-works#subastas">Cómo funciona</Link>
          </Button>
        </div>
      </Card>

      <AuctionCreateForm inventory={inventory} />

      {scheduled.length > 0 ? (
        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 className="text-h3 flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Programadas ({scheduled.length})
            </h2>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scheduled.map((auction) => (
              <AuctionListingCard key={auction.id} auction={auction} isLoggedIn />
            ))}
          </div>
        </section>
      ) : null}

      {active.length > 0 ? (
        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 className="text-h3 flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Activas ({active.length})
            </h2>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((auction) => (
              <AuctionListingCard key={auction.id} auction={auction} isLoggedIn />
            ))}
          </div>
        </section>
      ) : null}

      {closed.length > 0 ? (
        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 className="text-h3">Cerradas ({closed.length})</h2>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {closed.map((auction) => (
              <AuctionListingCard key={auction.id} auction={auction} isLoggedIn />
            ))}
          </div>
        </section>
      ) : null}

      {mineAuctions.length === 0 ? (
        <EmptyState
          icon={<Gavel className="h-8 w-8" />}
          title="Todavía no subastaste nada"
          description="Creá tu primera subasta. Si la programás, los coleccionistas se pueden anotar para recibir aviso cuando arranque."
        />
      ) : null}
    </section>
  );
}
