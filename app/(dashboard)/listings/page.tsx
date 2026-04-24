import Link from "next/link";
import { ListingCreateForm } from "@/components/listing-create-form";
import { SellerPaymentProfileForm } from "@/components/seller-payment-profile-form";
import { ListingRow } from "@/components/listing-row";
import { getSellerPaymentProfile, listListings } from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  let listings = [] as Awaited<ReturnType<typeof listListings>>;
  let loadError: string | null = null;
  let paymentProfile: Awaited<ReturnType<typeof getSellerPaymentProfile>> | null = null;
  let paymentProfileError: string | null = null;

  try {
    listings = await listListings({ sellerId: user.id });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load listings.";
  }

  try {
    paymentProfile = await getSellerPaymentProfile(user.id);
  } catch (error) {
    paymentProfileError =
      error instanceof Error ? error.message : "Failed to load seller payment profile.";
  }

  const active = listings.filter((l) => l.status === "active");
  const closed = listings.filter((l) => l.status !== "active");

  return (
    <section className="space-y-5">
      <header className="surface-panel p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-black/55">
          Paso 2 de 2 · Tus ofertas en el Mercado
        </p>
        <h1 className="mt-1 text-3xl [font-family:var(--font-display)]">
          Publicaciones
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Tus ofertas visibles en el{" "}
          <Link href="/market" className="underline">Mercado</Link>. Para publicar una
          carta individual, cargala en{" "}
          <Link href="/inventory" className="underline">Inventario</Link> y tocá
          &quot;Publicar en Mercado&quot;. Acá podés publicar{" "}
          <strong>Mystery Packs</strong> o administrar las publicaciones existentes.
        </p>
      </header>

      {!isSupabaseConfigured() ? (
        <article className="surface-panel border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Configurá Supabase para publicar en producción.
        </article>
      ) : null}

      {loadError ? (
        <article className="surface-panel border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Error de backend: {loadError}
        </article>
      ) : null}

      {paymentProfileError ? (
        <article className="surface-panel border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          No se pudo cargar tu perfil de cobro: {paymentProfileError}
        </article>
      ) : null}

      {paymentProfile ? <SellerPaymentProfileForm initialProfile={paymentProfile} /> : null}

      <ListingCreateForm />

      <div className="surface-panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Publicaciones activas</h2>
          <span className="text-xs text-black/55">{active.length} activas</span>
        </div>
        {active.length === 0 ? (
          <p className="mt-3 text-sm text-black/60">
            No tenés publicaciones activas. Publicá una carta desde{" "}
            <Link href="/inventory" className="underline">Inventario</Link> o
            creá un Mystery Pack arriba.
          </p>
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
      </div>

      {closed.length > 0 ? (
        <div className="surface-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Historial</h2>
            <span className="text-xs text-black/55">{closed.length} cerradas</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {closed.map((listing) => (
              <ListingRow
                key={`${listing.id}:${listing.status}:${listing.priceArs}:${listing.quantity}:${listing.imageUrl ?? ""}:${listing.reservedAt ?? ""}:${listing.offersShipping}:${listing.offersPickup}:${listing.deliveryAreaNotes ?? ""}`}
                listing={listing}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
