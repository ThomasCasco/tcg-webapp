import Link from "next/link";
import { listPublicTradeProfiles } from "@/lib/server/repository";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Search } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  let profiles: Awaited<ReturnType<typeof listPublicTradeProfiles>> = [];
  let loadError: string | null = null;

  try {
    profiles = await listPublicTradeProfiles();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load trades.";
  }

  if (query) {
    profiles = profiles
      .map((profile) => ({
        ...profile,
        tradeCards: profile.tradeCards.filter((card) =>
          `${card.cardName} ${card.setName ?? ""} ${card.tradeNotes ?? ""}`
            .toLowerCase()
            .includes(query),
        ),
        wantedCards: profile.wantedCards.filter((watch) =>
          `${watch.query} ${watch.notes ?? ""}`.toLowerCase().includes(query),
        ),
      }))
      .filter((profile) => profile.tradeCards.length > 0 || profile.wantedCards.length > 0);
  }

  const tradeCount = profiles.reduce((total, profile) => total + profile.tradeCards.length, 0);
  const wantedCount = profiles.reduce((total, profile) => total + profile.wantedCards.length, 0);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
      <header className="glass rounded-[var(--r-md)] p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr,auto] lg:items-end">
          <div>
            <Chip variant="accent" size="sm">Trades Pokemon</Chip>
            <h1 className="mt-3 text-h1 [font-family:var(--font-display)]">
              Intercambia cartas con otros coleccionistas
            </h1>
            <p className="mt-2 max-w-2xl text-body-sm text-[var(--color-ink-muted)]">
              Marca tus cartas disponibles, publica que estas buscando y encontra perfiles
              con intereses compatibles antes de mandar una propuesta.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button asChild>
              <Link href="/inventory">Marcar mis cartas</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/alerts">Publicar buscadas</Link>
            </Button>
          </div>
        </div>

        <form method="GET" className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar carta, set o nota de trade..."
              className="pl-9"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </form>
      </header>

      {!isSupabaseConfigured() && (
        <Card padding="md" className="border-[var(--color-warning)] bg-[var(--color-warning-soft)]">
          <p className="text-body-sm text-[var(--color-warning)]">
            Configura Supabase para publicar perfiles reales de trade.
          </p>
        </Card>
      )}

      {loadError && (
        <Card padding="md" className="border-[var(--color-danger)] bg-[var(--color-danger-soft)]">
          <p className="text-body-sm text-[var(--color-danger)]">Error: {loadError}</p>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Card padding="md">
          <p className="text-overline text-[var(--color-ink-subtle)]">Perfiles activos</p>
          <p className="mt-1 text-2xl font-semibold">{profiles.length}</p>
        </Card>
        <Card padding="md">
          <p className="text-overline text-[var(--color-ink-subtle)]">Cartas para trade</p>
          <p className="mt-1 text-2xl font-semibold">{tradeCount}</p>
        </Card>
        <Card padding="md">
          <p className="text-overline text-[var(--color-ink-subtle)]">Cartas buscadas</p>
          <p className="mt-1 text-2xl font-semibold">{wantedCount}</p>
        </Card>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          image="/img/empty-states/trades-empty.png"
          imageAlt="Dos cartas cruzadas en intercambio"
          title="Sin perfiles de trade"
          description="Marca cartas de tu inventario como disponibles para trade o publica cartas buscadas desde Alertas."
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {profiles.map((profile) => (
            <Card key={profile.userId} as="article" padding="lg" className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-overline text-[var(--color-ink-subtle)]">Coleccionista</p>
                  <h2 className="text-h2">@{profile.username}</h2>
                </div>
                <Chip variant="info" size="sm">
                  {profile.tradeCards.length} ofrece / {profile.wantedCards.length} busca
                </Chip>
              </div>

              <div>
                <h3 className="mb-2 text-body-sm font-semibold">Ofrece</h3>
                {profile.tradeCards.length === 0 ? (
                  <p className="text-caption text-[var(--color-ink-muted)]">Sin cartas marcadas.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {profile.tradeCards.slice(0, 6).map((card) => (
                      <div
                        key={card.id}
                        className="glass-soft flex gap-3 rounded-[var(--r-sm)] p-2"
                      >
                        <div className="glass-soft h-20 w-14 shrink-0 overflow-hidden rounded-md">
                          {card.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={card.imageUrl} alt={card.cardName} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-body-sm font-semibold">{card.cardName}</p>
                          <p className="truncate text-caption text-[var(--color-ink-muted)]">
                            {card.setName || "Sin set"}
                          </p>
                          <p className="text-caption text-[var(--color-ink-muted)]">
                            {formatConditionEs(card.condition)} - x{card.quantity}
                          </p>
                          {card.tradeNotes && (
                            <p className="line-clamp-2 text-caption text-[var(--color-ink-subtle)]">
                              {card.tradeNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-body-sm font-semibold">Busca</h3>
                {profile.wantedCards.length === 0 ? (
                  <p className="text-caption text-[var(--color-ink-muted)]">Sin cartas buscadas.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.wantedCards.slice(0, 10).map((watch) => (
                      <span
                        key={watch.id}
                        className="chip"
                        title={watch.notes}
                      >
                        {watch.query}
                        {watch.maxPriceArs
                          ? ` - hasta ARS ${watch.maxPriceArs.toLocaleString("es-AR")}`
                          : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button asChild variant="secondary" fullWidth>
                <Link href={`/u/${profile.username}`}>Ver perfil</Link>
              </Button>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
