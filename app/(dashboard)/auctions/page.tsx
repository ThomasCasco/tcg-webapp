import { redirect } from "next/navigation";
import { AuctionManager } from "@/components/auction-manager";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listAuctions } from "@/lib/server/repository";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Gavel } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function AuctionsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  let myAuctions: Awaited<ReturnType<typeof listAuctions>> = [];
  let myBids: Awaited<ReturnType<typeof listAuctions>> = [];
  let loadError: string | null = null;

  try {
    [myAuctions, myBids] = await Promise.all([
      listAuctions({ sellerId: user.id }),
      listAuctions({ bidderId: user.id }),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load auctions.";
  }

  return (
    <section className="space-y-5">
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">Subastas</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Subastas y ofertas
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Crea subastas desde Inventario, segui tus pujas y cerra las subastas vencidas para adjudicar ganador.
        </p>
      </Card>

      {loadError ? (
        <Card padding="md" className="border-rose-300 bg-rose-50">
          <p className="text-sm text-rose-900">Error: {loadError}</p>
        </Card>
      ) : null}

      <Card padding="lg">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-h3">Mis subastas</h2>
          <span className="text-caption text-[var(--color-ink-subtle)]">{myAuctions.length}</span>
        </div>
        {myAuctions.length === 0 ? (
          <EmptyState
            icon={<Gavel className="h-8 w-8" />}
            title="Sin subastas"
            description="Abri una carta en Inventario y toca Subastar."
            className="mt-4"
          />
        ) : (
          <div className="mt-4">
            <AuctionManager auctions={myAuctions} />
          </div>
        )}
      </Card>

      <Card padding="lg">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-h3">Mis ofertas</h2>
          <span className="text-caption text-[var(--color-ink-subtle)]">{myBids.length}</span>
        </div>
        {myBids.length === 0 ? (
          <EmptyState
            icon={<Gavel className="h-8 w-8" />}
            title="Aun no ofertaste"
            description="Explora el Mercado y participa en una subasta activa."
            className="mt-4"
          />
        ) : (
          <div className="mt-4">
            <AuctionManager auctions={myBids} />
          </div>
        )}
      </Card>
    </section>
  );
}
