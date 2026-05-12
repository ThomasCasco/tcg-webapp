import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { fetchCatalogCardById } from "@/lib/server/tcgdex";

export const dynamic = "force-dynamic";

export default async function CatalogCardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const card = await fetchCatalogCardById(cardId).catch(() => null);
  if (!card) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 md:py-8">
      <Link href="/market" className="t-sm text-[var(--accent-hi)] underline">
        ← Volver al mercado
      </Link>

      <Card as="section" padding="lg">
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          {card.imageLarge || card.imageSmall ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={card.imageLarge ?? card.imageSmall ?? ""}
              alt={card.name}
              className="h-[320px] w-[220px] rounded-[var(--r-md)] object-cover"
            />
          ) : (
            <div className="grid h-[320px] w-[220px] place-items-center rounded-[var(--r-md)] bg-[rgba(8,12,28,0.4)] t-sm t-soft">
              Sin imagen de catálogo
            </div>
          )}

          <div>
            <p className="t-eyebrow">{card.setName || "Set desconocido"}</p>
            <h1 className="mt-1 t-h1 text-[2.25rem]">{card.name}</h1>
            <p className="mt-2 t-sm t-mute">
              Origen: {card.setName || "n/d"}
              {card.number ? ` · N° ${card.number}` : ""}
              {card.setId ? ` · Set ${card.setId}` : ""}
            </p>
            {card.rarity ? <p className="mt-1 t-sm t-mute">Rareza: {card.rarity}</p> : null}

            {card.marketPriceEur ? (
              <Card variant="muted" padding="sm" className="mt-4">
                <p className="t-eyebrow">Referencia internacional</p>
                <p className="mt-1 t-sm t-mono">EUR {card.marketPriceEur.toFixed(2)} · Cardmarket</p>
              </Card>
            ) : null}
          </div>
        </div>
      </Card>
    </main>
  );
}
