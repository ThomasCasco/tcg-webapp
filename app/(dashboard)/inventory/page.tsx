import Link from "next/link";
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
  let loadError = false;

  try {
    inventoryEntries = await listInventoryEntries({ ownerId: user.id });
    const myListings = await listListings({ sellerId: user.id });
    activeListingsByInventoryId = new Set(
      myListings
        .filter((l) => l.status === "active" && l.inventoryId)
        .map((l) => l.inventoryId!),
    );
  } catch (error) {
    loadError = true;
    console.error("[inventory] load failed", error);
  }

  const totalCards = inventoryEntries.reduce((acc, item) => acc + item.quantity, 0);
  const withPrice = inventoryEntries.filter((i) => i.askingPriceArs && i.askingPriceArs > 0).length;
  const configError = !isSupabaseConfigured() || loadError;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <p className="mt-1.5 text-sm muted">
          Cargá las cartas que tenés físicamente. Cuando estén listas, publicalas al{" "}
          <Link href="/market" className="font-semibold text-[var(--color-accent)] hover:underline">
            Mercado
          </Link>
          .
        </p>
      </header>

      {configError ? (
        <div className="rounded-lg bg-[var(--color-warning-soft)] px-4 py-3 text-sm text-[var(--color-warning)]">
          No pudimos cargar tu inventario. Probá refrescar en unos minutos.
        </div>
      ) : null}

      {inventoryEntries.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <p className="eyebrow">Entradas</p>
            <p className="mt-1 text-2xl font-bold">{inventoryEntries.length}</p>
          </div>
          <div className="card p-4">
            <p className="eyebrow">Cartas totales</p>
            <p className="mt-1 text-2xl font-bold">{totalCards}</p>
          </div>
          <div className="card p-4">
            <p className="eyebrow">Con precio</p>
            <p className="mt-1 text-2xl font-bold">
              {withPrice}
              <span className="text-base font-medium muted"> / {inventoryEntries.length}</span>
            </p>
          </div>
        </div>
      ) : null}

      <InventoryCreateForm />

      {inventoryEntries.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl">📇</p>
          <p className="mt-3 font-semibold">Tu inventario está vacío</p>
          <p className="mt-1 text-sm muted">
            Usá el buscador de arriba para agregar tu primera carta.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide subtle">Tus cartas</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {inventoryEntries.map((entry) => (
              <InventoryEntryCard
                key={`${entry.id}:${entry.askingPriceArs ?? 0}:${entry.quantity}:${entry.imageUrl ?? ""}:${activeListingsByInventoryId.has(entry.id)}`}
                entry={entry}
                alreadyListed={activeListingsByInventoryId.has(entry.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
