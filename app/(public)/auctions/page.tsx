import Link from "next/link";
import { AuctionListingCard } from "@/components/auction-listing-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarClock, Gavel, Info } from "@/components/ui/icon";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listAuctions } from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export default async function PublicAuctionsPage() {
  const viewer = await getAuthenticatedUser();
  const isLoggedIn = Boolean(viewer);

  let upcoming: Awaited<ReturnType<typeof listAuctions>> = [];
  let active: Awaited<ReturnType<typeof listAuctions>> = [];
  let closed: Awaited<ReturnType<typeof listAuctions>> = [];
  let loadError: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const [upcomingResult, activeResult, closedResult] = await Promise.all([
        listAuctions({
          statuses: ["scheduled"],
          viewerUserId: viewer?.id,
        }),
        listAuctions({
          statuses: ["active"],
          viewerUserId: viewer?.id,
        }),
        listAuctions({
          statuses: ["ended", "settled"],
          viewerUserId: viewer?.id,
        }),
      ]);
      upcoming = upcomingResult;
      active = activeResult;
      closed = closedResult.slice(0, 8);
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Error al cargar subastas.";
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-6 md:py-8">
      <header className="border-b border-[var(--color-border-strong)] pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Subastas</p>
            <h1 className="mt-1 text-display-md text-[var(--color-ink)] md:text-display-lg">
              Subastas TCG
            </h1>
            <p className="mt-2 max-w-2xl text-body-sm text-[var(--color-ink-muted)]">
              Anotate a las próximas subastas para que te avisemos cuando arranquen.
              También podés pujar en las activas. El ganador coordina pago con el
              vendedor igual que en el marketplace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/how-it-works#subastas">
                <Info className="h-4 w-4" />
                Cómo funciona
              </Link>
            </Button>
            {viewer ? (
              <Button asChild>
                <Link href="/auctions">
                  <Gavel className="h-4 w-4" />
                  Crear subasta
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/register">Crear cuenta</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {loadError ? (
        <Card padding="md" className="border-[var(--color-danger)] bg-[var(--color-danger-soft)]">
          <p className="text-body-sm text-[var(--color-danger)]">Error: {loadError}</p>
        </Card>
      ) : null}

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-h2 [font-family:var(--font-display)] flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[var(--color-accent-strong)]" />
            Próximas subastas
            <span className="text-body-sm font-semibold text-[var(--color-ink-muted)]">
              ({upcoming.length})
            </span>
          </h2>
        </header>
        {upcoming.length === 0 ? (
          <EmptyState
            image="/img/empty-states/auctions-empty.png"
            imageAlt="Martillo de subasta"
            title="Sin subastas programadas"
            description="Cuando un vendedor programe una subasta, vas a poder anotarte para que te avisemos cuando arranque."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {upcoming.map((auction) => (
              <AuctionListingCard key={auction.id} auction={auction} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-h2 [font-family:var(--font-display)] flex items-center gap-2">
            <Gavel className="h-5 w-5 text-[var(--color-accent-strong)]" />
            En vivo
            <span className="text-body-sm font-semibold text-[var(--color-ink-muted)]">
              ({active.length})
            </span>
          </h2>
        </header>
        {active.length === 0 ? (
          <EmptyState
            image="/img/empty-states/auctions-empty.png"
            imageAlt="Martillo de subasta"
            title="Sin subastas activas"
            description="No hay subastas en vivo en este momento. Revisá las próximas o volvé más tarde."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {active.map((auction) => (
              <AuctionListingCard key={auction.id} auction={auction} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        )}
      </section>

      {closed.length > 0 ? (
        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 className="text-h3">Cerradas recientes</h2>
          </header>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {closed.map((auction) => (
              <AuctionListingCard key={auction.id} auction={auction} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
