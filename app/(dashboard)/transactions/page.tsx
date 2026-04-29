import { redirect } from "next/navigation";
import { PaymentVerifyForm } from "@/components/payment-verify-form";
import { P2pPaymentExplainer } from "@/components/p2p-payment-explainer";
import { TransactionCard } from "@/components/transaction-card";
import { TransactionFulfillmentForm } from "@/components/transaction-fulfillment-form";
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
    loadError =
      error instanceof Error ? error.message : "Failed to load transactions.";
  }

  return (
    <section className="space-y-4">
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">Transacciones</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Seguimiento entre comprador y vendedor
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Acá ves operaciones donde participás: como comprador verificás el pago que hiciste al
          vendedor; como vendedor ves el mismo estado y avanzás el envío o retiro cuando corresponda.
        </p>
      </Card>

      <P2pPaymentExplainer />

      <PaymentVerifyForm />
      <TransactionFulfillmentForm />

      {loadError ? (
        <Card as="article" padding="md" className="border-rose-300 bg-rose-50">
          <p className="text-sm text-rose-900">Error de backend: {loadError}</p>
        </Card>
      ) : null}

      {transactions.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-8 w-8" />}
          title="Sin transacciones"
          description="Todavía no tenés reservas ni ventas. Reservá una publicación desde el Mercado."
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
