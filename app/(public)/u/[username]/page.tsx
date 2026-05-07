import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import {
  getPublicProfileByUsername,
  listInventoryEntries,
} from "@/lib/server/repository";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftRight, Package, Search, ShoppingBag } from "@/components/ui/icon";
import { FollowProfileButton } from "@/components/follow-profile-button";
import { TradeProposalForm } from "@/components/trade-proposal-form";

export const dynamic = "force-dynamic";

export default async function PublicUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const { tab = "trade" } = await searchParams;
  const user = await getAuthenticatedUser();
  const detail = await getPublicProfileByUsername(username, user?.id);
  if (!detail) notFound();

  const { profile, tradeCards, wantedCards, listings } = detail;
  const myInventory =
    user && user.id !== profile.userId
      ? await listInventoryEntries({ ownerId: user.id })
      : [];
  const visibleTab = ["trade", "wants", "listings"].includes(tab) ? tab : "trade";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
      <Card as="header" padding="lg" className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              name={profile.displayName ?? profile.username}
              src={profile.avatarUrl}
              size="lg"
              className="h-16 w-16 text-lg"
            />
            <div className="min-w-0">
              <p className="text-overline text-[var(--color-ink-subtle)]">Perfil publico</p>
              <h1 className="truncate text-h1 [font-family:var(--font-display)]">
                {profile.displayName || `@${profile.username}`}
              </h1>
              <p className="text-body-sm text-[var(--color-ink-muted)]">@{profile.username}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user && user.id !== profile.userId ? (
              <FollowProfileButton
                followingId={profile.userId}
                initialFollowing={Boolean(detail.isFollowing)}
              />
            ) : null}
            <div className="rounded-lg bg-[var(--color-accent-soft)] px-4 py-3 text-center">
              <p className="text-overline text-[var(--color-accent-strong)]">Perfil completo</p>
              <p className="text-3xl font-semibold text-[var(--color-accent-strong)]">
                {profile.completionScore}%
              </p>
            </div>
          </div>
        </div>

        {profile.bio ? (
          <p className="max-w-3xl text-body text-[var(--color-ink-muted)]">{profile.bio}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {profile.location ? <Chip>{profile.location}</Chip> : null}
          {profile.favoriteGame ? <Chip>{profile.favoriteGame}</Chip> : null}
          {profile.favoriteCard ? <Chip>{profile.favoriteCard}</Chip> : null}
          {profile.instagram ? <Chip>Instagram {profile.instagram}</Chip> : null}
          {profile.discord ? <Chip>Discord {profile.discord}</Chip> : null}
          {profile.badges.map((badge) => (
            <Chip key={badge} variant="success">{badge}</Chip>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card padding="sm" variant="muted">
            <p className="text-overline text-[var(--color-ink-subtle)]">Para trade</p>
            <p className="mt-1 text-2xl font-semibold">{profile.tradeCount}</p>
          </Card>
          <Card padding="sm" variant="muted">
            <p className="text-overline text-[var(--color-ink-subtle)]">Busca</p>
            <p className="mt-1 text-2xl font-semibold">{profile.wantedCount}</p>
          </Card>
          <Card padding="sm" variant="muted">
            <p className="text-overline text-[var(--color-ink-subtle)]">Publicaciones</p>
            <p className="mt-1 text-2xl font-semibold">{profile.listingCount}</p>
          </Card>
          <Card padding="sm" variant="muted">
            <p className="text-overline text-[var(--color-ink-subtle)]">Seguidores</p>
            <p className="mt-1 text-2xl font-semibold">{profile.followersCount}</p>
          </Card>
        </div>
      </Card>

      {user && user.id !== profile.userId ? (
        <TradeProposalForm
          recipientId={profile.userId}
          recipientHandle={profile.username}
          myInventory={myInventory}
          targetTradeCards={tradeCards}
        />
      ) : !user && tradeCards.length > 0 ? (
        <Card padding="lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-overline text-[var(--color-ink-subtle)]">Trade</p>
              <h2 className="mt-1 text-h3">Inicia sesion para proponer intercambio</h2>
              <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">
                Necesitas una cuenta y cartas cargadas en tu inventario para enviar una propuesta.
              </p>
            </div>
            <Button asChild>
              <Link href="/login">Ingresar</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      <nav className="flex gap-1 overflow-x-auto rounded-[var(--radius-card)] bg-[var(--color-surface-elevated)] p-1">
        {[
          { key: "trade", label: "Tiene para trade" },
          { key: "wants", label: "Busca" },
          { key: "listings", label: "Publicaciones" },
        ].map((item) => (
          <Link
            key={item.key}
            href={`/u/${profile.username}?tab=${item.key}`}
            className={`shrink-0 rounded-[var(--radius-input)] px-3 py-2 text-body-sm font-medium ${
              visibleTab === item.key
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {visibleTab === "trade" ? (
      <section>
        <Card padding="lg">
          <div className="mb-3 flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-[var(--color-accent-strong)]" />
            <h2 className="text-h2">Tiene para trade</h2>
          </div>
          {tradeCards.length === 0 ? (
            <EmptyState
              icon={<Package className="h-7 w-7" />}
              title="Sin cartas para trade"
              description="Este perfil todavia no marco cartas disponibles."
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {tradeCards.map((card) => (
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
                    {card.tradeNotes ? (
                      <p className="line-clamp-2 text-caption text-[var(--color-ink-subtle)]">
                        {card.tradeNotes}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
      ) : null}
      {visibleTab === "wants" ? (
        <Card padding="lg">
          <div className="mb-3 flex items-center gap-2">
            <Search className="h-5 w-5 text-[var(--color-accent-strong)]" />
            <h2 className="text-h2">Cartas que busca</h2>
          </div>
          {wantedCards.length === 0 ? (
            <EmptyState
              icon={<Search className="h-7 w-7" />}
              title="Sin buscadas publicas"
              description="Este perfil todavia no publico cartas buscadas."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {wantedCards.map((watch) => (
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
        </Card>
      ) : null}
      {visibleTab === "listings" ? (
      <Card padding="lg">
        <div className="mb-3 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-[var(--color-accent-strong)]" />
          <h2 className="text-h2">Publicaciones</h2>
        </div>
        {listings.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-7 w-7" />}
            title="Sin publicaciones"
            description="No hay publicaciones visibles de este usuario."
          />
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/market/${listing.id}`}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-accent-soft)]/40"
              >
                <p className="font-semibold">{listing.cardName}</p>
                <p className="text-caption text-[var(--color-ink-muted)]">{listing.setName}</p>
                <p className="mt-1 text-body-sm font-semibold">
                  ARS {listing.priceArs.toLocaleString("es-AR")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Card>
      ) : null}

      <Button asChild variant="secondary">
        <Link href="/profiles">Volver a perfiles</Link>
      </Button>
    </main>
  );
}
