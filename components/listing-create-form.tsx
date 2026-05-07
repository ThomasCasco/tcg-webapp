import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Tag } from "@/components/ui/icon";

export function ListingCreateForm() {
  return (
    <Card padding="md">
      <div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-center">
        <div>
          <p className="text-overline text-[var(--color-ink-subtle)]">Publicar</p>
          <h2 className="mt-1 text-h3">Cartas individuales y trades</h2>
          <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">
            Los sobres quedan pausados por ahora. Para vender, carga una carta en tu
            inventario y publicala en el mercado. Para intercambiar, marcala como
            disponible para trade desde la misma tarjeta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button asChild variant="secondary">
            <Link href="/inventory">
              <Tag className="h-4 w-4" />
              Ir al inventario
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/trades">
              <ArrowLeftRight className="h-4 w-4" />
              Ver trades
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
