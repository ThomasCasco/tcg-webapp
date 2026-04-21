import { inventoryEntries } from "@/lib/domain/mock-data";

const conditionBadge: Record<string, string> = {
  mint: "bg-emerald-100 text-emerald-800",
  near_mint: "bg-green-100 text-green-800",
  lightly_played: "bg-yellow-100 text-yellow-800",
  moderately_played: "bg-orange-100 text-orange-800",
  heavily_played: "bg-amber-100 text-amber-800",
  damaged: "bg-rose-100 text-rose-800",
};

export default function InventoryPage() {
  const totalCards = inventoryEntries.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
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
            Estado
          </p>
          <p className="mt-1 text-2xl font-semibold">Mock conectado</p>
        </article>
      </div>

      <div className="surface-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-black/70">
            <tr>
              <th className="px-4 py-3 font-semibold">Carta</th>
              <th className="px-4 py-3 font-semibold">Condicion</th>
              <th className="px-4 py-3 font-semibold">Cantidad</th>
              <th className="px-4 py-3 font-semibold">Precio ARS</th>
            </tr>
          </thead>
          <tbody>
            {inventoryEntries.map((item) => (
              <tr key={item.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-3">{item.cardName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${conditionBadge[item.condition]}`}
                  >
                    {item.condition}
                  </span>
                </td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">
                  {item.askingPriceArs?.toLocaleString("es-AR") ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}