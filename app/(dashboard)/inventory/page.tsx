import { InventoryCreateForm } from "@/components/inventory-create-form";
import { InventoryEntryCard } from "@/components/inventory-entry-card";
import { listInventoryEntries, listListings } from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  let inventoryEntries = [] as Awaited<ReturnType<typeof listInventoryEntries>>;
  let activeListingsByInventoryId = new Set<string>();
  let loadError: string | null = null;

  try {
    inventoryEntries = await listInventoryEntries({ ownerId: user.id });
    const myListings = await listListings({ sellerId: user.id });
    activeListingsByInventoryId = new Set(
      myListings
        .filter((l) => l.status === "active" && l.inventoryId)
        .map((l) => l.inventoryId!),
    );
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load inventory.";
  }

  const totalCards = inventoryEntries.reduce((acc, item) => acc + item.quantity, 0);
  const withPrice = inventoryEntries.filter((i) => i.askingPriceArs && i.askingPriceArs > 0).length;

  return (
    <section className="space-y-5">
      <header className="surface-panel p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-black/55">
          Paso 1 de 2 · Tu stock
        </p>
        <h1 className="mt-1 text-3xl [font-family:var(--font-display)]">
          Inventario
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Cargá acá las cartas que tenés físicamente. Es tu stock privado.
          Cuando estés listo, poné un precio y tocá <strong>Publicar en Mercado</strong> para
          que otros usuarios puedan comprarla.
        </p>
      </header>

      {!isSupabaseConfigured() ? (
        <article className="surface-panel border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Configurá las variables de Supabase para guardar datos reales.
        </article>
      ) : null}

      {loadError ? (
        <article className="surface-panel border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Error de backend: {loadError}
        </article>
      ) : null}

      <InventoryCreateForm />

      <div className="grid gap-3 md:grid-cols-3">
        <article className="surface-panel p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-black/55">
            Entradas
          </p>
          <p className="mt-1 text-2xl font-semibold">{inventoryEntries.length}</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-black/55">
            Cartas totales
          </p>
          <p className="mt-1 text-2xl font-semibold">{totalCards}</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-black/55">
            Con precio cargado
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {withPrice} / {inventoryEntries.length}
          </p>
        </article>
      </div>

      {inventoryEntries.length === 0 ? (
        <div className="surface-panel p-8 text-center text-sm text-black/60">
          Todavía no cargaste ninguna carta. Usá el buscador de arriba para
          agregar tu primera entrada.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {inventoryEntries.map((entry) => (
            <InventoryEntryCard
              key={`${entry.id}:${entry.askingPriceArs ?? 0}:${entry.quantity}:${entry.imageUrl ?? ""}:${activeListingsByInventoryId.has(entry.id)}`}
              entry={entry}
              alreadyListed={activeListingsByInventoryId.has(entry.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
