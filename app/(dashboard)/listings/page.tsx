import Link from "next/link";
import { ListingCreateForm } from "@/components/listing-create-form";
import { ListingRow } from "@/components/listing-row";
import { listListings } from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  let listings = [] as Awaited<ReturnType<typeof listListings>>;
  let loadError: string | null = null;

  try {
    const allListings = await listListings({ sellerId: user.id });
    listings = allListings.filter((listing) => listing.listingType !== "mystery_pack");
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load listings.";
  }

  const active = listings.filter((l) => l.status === "active");
  const closed = listings.filter((l) => l.status !== "active");

  return (
    <section className="space-y-5">
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">
          Paso 2 de 2 · Tus cartas en el mercado
        </p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Publicaciones
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Tus ofertas visibles en el{" "}
          <Link href="/market" className="underline">Mercado</Link>. Para publicar
          una carta a precio fijo, cargala en{" "}
          <Link href="/inventory" className="underline">Inventario</Link> y tocá
          &quot;Publicar en Mercado&quot;. Si preferís subastarla, andá a{" "}
          <Link href="/my-auctions" className="underline">Mis subastas</Link>.
        </p>
      </Card>

      {!isSupabaseConfigured() ? (
        <Card as="article" padding="md" className="border-amber-300 bg-amber-50">
          <p className="text-sm text-amber-900">
            Configura Supabase para publicar en produccion.
          </p>
        </Card>
      ) : null}

      {loadError ? (
        <Card as="article" padding="md" className="border-rose-300 bg-rose-50">
          <p className="text-sm text-rose-900">Error de backend: {loadError}</p>
        </Card>
      ) : null}

      <ListingCreateForm />

      <Card padding="lg">
        <div className="flex items-center justify-between">
          <h2 className="text-h3">Publicaciones activas</h2>
          <span className="text-caption text-[var(--color-ink-subtle)]">{active.length} activas</span>
        </div>
        {active.length === 0 ? (
          <EmptyState
            image="/img/empty-states/market-empty.png"
            imageAlt="Caja vacía"
            title="Sin publicaciones activas"
            description={
              <>
                Publica una carta desde{" "}
                <Link href="/inventory" className="underline">Inventario</Link> o
                marca cartas disponibles para trade.
              </>
            }
            className="mt-4"
          />
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {active.map((listing) => (
              <ListingRow
                key={`${listing.id}:${listing.status}:${listing.priceArs}:${listing.quantity}:${listing.imageUrl ?? ""}:${listing.reservedAt ?? ""}:${listing.offersShipping}:${listing.offersPickup}:${listing.deliveryAreaNotes ?? ""}`}
                listing={listing}
              />
            ))}
          </div>
        )}
      </Card>

      {closed.length > 0 ? (
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="text-h3">Historial</h2>
            <span className="text-caption text-[var(--color-ink-subtle)]">{closed.length} cerradas</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {closed.map((listing) => (
              <ListingRow
                key={`${listing.id}:${listing.status}:${listing.priceArs}:${listing.quantity}:${listing.imageUrl ?? ""}:${listing.reservedAt ?? ""}:${listing.offersShipping}:${listing.offersPickup}:${listing.deliveryAreaNotes ?? ""}`}
                listing={listing}
              />
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
