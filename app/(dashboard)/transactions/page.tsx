import { redirect } from "next/navigation";
import { TransactionCard } from "@/components/transaction-card";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listTransactionsForUser } from "@/lib/server/repository";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftRight } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  let transactions = [] as Awaited<ReturnType<typeof listTransactionsForUser>>;
  let loadError: string | null = null;

  try {
    transactions = await listTransactionsForUser(user.id);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load transactions.";
  }

  return (
    <section className="space-y-4">
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">Transacciones</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Tus compras y ventas
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Acá ves el estado de cada operación. El pago se confirma automáticamente
          por Mercado Pago. Como vendedor marcás el envío; como comprador confirmás la recepción.
        </p>
      </Card>

      {loadError && (
        <Card as="article" padding="md" className="border-[var(--color-danger)] bg-[var(--color-danger-soft)]">
          <p className="text-body-sm text-[var(--color-danger)]">Error: {loadError}</p>
        </Card>
      )}

      {transactions.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-8 w-8" />}
          title="Sin transacciones"
          description="Todavía no tenés compras ni ventas. Buscá cartas en el Mercado para empezar."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              viewerUserId={user.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
