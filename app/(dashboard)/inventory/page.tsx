import { InventoryCreateForm } from "@/components/inventory-create-form";
import { InventoryEntryCard } from "@/components/inventory-entry-card";
import { listInventoryEntries, listListings } from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Info, Package } from "@/components/ui/icon";

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
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">
          Paso 1 de 2 · Tu stock
        </p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Inventario
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Cargá acá las cartas que tenés físicamente. Es tu stock privado.
          Cuando estés listo, poné un precio y tocá <strong>Publicar en Mercado</strong> para
          que otros usuarios puedan comprarla. Tambien podes marcarlas como disponibles
          para trade y sumar notas de intercambio.
        </p>
      </Card>

      {!isSupabaseConfigured() ? (
        <Card as="article" padding="md" className="border-amber-300 bg-amber-50">
          <p className="text-sm text-amber-900">
            Configurá las variables de Supabase para guardar datos reales.
          </p>
        </Card>
      ) : null}

      {loadError ? (
        <Card as="article" padding="md" className="border-rose-300 bg-rose-50">
          <p className="text-sm text-rose-900">Error de backend: {loadError}</p>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <Card as="article" padding="md">
          <p className="text-overline text-[var(--color-ink-subtle)]">Entradas</p>
          <p className="mt-1 text-2xl font-semibold">{inventoryEntries.length}</p>
        </Card>
        <Card as="article" padding="md">
          <p className="text-overline text-[var(--color-ink-subtle)]">Cartas totales</p>
          <p className="mt-1 text-2xl font-semibold">{totalCards}</p>
        </Card>
        <Card as="article" padding="md">
          <p className="text-overline text-[var(--color-ink-subtle)]">Con precio cargado</p>
          <p className="mt-1 text-2xl font-semibold">
            {withPrice} / {inventoryEntries.length}
          </p>
        </Card>
      </div>

      <InventoryCreateForm defaultOpen={inventoryEntries.length === 0} />

      {inventoryEntries.length === 0 ? (
        <EmptyState
          image="/img/empty-states/inventory-empty.png"
          imageAlt="Binder de cartas vacío"
          title="Inventario vacío"
          description={
            <>
              <p>
                Usá el formulario de arriba para agregar tu primera carta. Sin
                inventario no podés publicar, subastar ni tradear.
              </p>
              <p className="mt-2 text-caption">
                ¿Primera vez por acá?{" "}
                <Link href="/how-it-works" className="font-semibold underline">
                  Mirá la guía
                </Link>{" "}
                de cómo funciona.
              </p>
            </>
          }
          action={
            <Button asChild variant="ghost">
              <Link href="/how-it-works">
                <Info className="h-4 w-4" />
                Cómo funciona
              </Link>
            </Button>
          }
        />
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
