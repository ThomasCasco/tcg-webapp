import Link from "next/link";
import { listPublicTradeProfiles } from "@/lib/server/repository";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftRight, Search } from "@/components/ui/icon";
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
      <header className="rounded-[var(--radius-card)] bg-[var(--color-surface-elevated)] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Comunidad</p>
            <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">Trades</h1>
            <p className="mt-2 max-w-2xl text-body-sm text-[var(--color-ink-muted)]">
              Cartas que otros usuarios tienen para intercambiar y cartas que estan buscando.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/inventory">Marcar mis cartas</Link>
          </Button>
        </div>

        <form method="GET" className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar carta, set o nota..."
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
          <p className="text-overline text-[var(--color-ink-subtle)]">Perfiles</p>
          <p className="mt-1 text-2xl font-semibold">{profiles.length}</p>
        </Card>
        <Card padding="md">
          <p className="text-overline text-[var(--color-ink-subtle)]">Para trade</p>
          <p className="mt-1 text-2xl font-semibold">{tradeCount}</p>
        </Card>
        <Card padding="md">
          <p className="text-overline text-[var(--color-ink-subtle)]">Buscadas</p>
          <p className="mt-1 text-2xl font-semibold">{wantedCount}</p>
        </Card>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-8 w-8" />}
          title="Sin perfiles de trade"
          description="Marca cartas de tu inventario como disponibles para trade o publica cartas buscadas desde Alertas."
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {profiles.map((profile) => (
            <Card key={profile.userId} as="article" padding="lg" className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-overline text-[var(--color-ink-subtle)]">Perfil</p>
                  <h2 className="text-h2">@{profile.username}</h2>
                </div>
                <Chip variant="info" size="sm">
                  {profile.tradeCards.length} / {profile.wantedCards.length}
                </Chip>
              </div>

              <div>
                <h3 className="mb-2 text-body-sm font-semibold">Tiene para trade</h3>
                {profile.tradeCards.length === 0 ? (
                  <p className="text-caption text-[var(--color-ink-muted)]">Sin cartas marcadas.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {profile.tradeCards.slice(0, 6).map((card) => (
                      <div
                        key={card.id}
                        className="flex gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
                      >
                        <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--color-surface-elevated)]">
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
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-caption"
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
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
