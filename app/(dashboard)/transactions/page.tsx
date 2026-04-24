import { redirect } from "next/navigation";
import { PaymentVerifyForm } from "@/components/payment-verify-form";
import { P2pPaymentExplainer } from "@/components/p2p-payment-explainer";
import { TransactionCard } from "@/components/transaction-card";
import { TransactionFulfillmentForm } from "@/components/transaction-fulfillment-form";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listTransactionsForUser } from "@/lib/server/repository";

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
      <P2pPaymentExplainer />

      <PaymentVerifyForm />
      <TransactionFulfillmentForm />

      {loadError ? (
        <article className="surface-panel border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Error de backend: {loadError}
        </article>
      ) : null}

      <div className="surface-panel p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-black/55">Transacciones</p>
        <h1 className="mt-1 text-3xl [font-family:var(--font-display)]">
          Seguimiento entre comprador y vendedor
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Acá ves operaciones donde participás: como comprador verificás el pago que hiciste al
          vendedor; como vendedor ves el mismo estado y avanzás el envío o retiro cuando corresponda.
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="surface-panel p-8 text-center text-sm text-black/60">
          Todavía no tenés reservas ni ventas. Reservá una publicación desde el{" "}
          <a href="/market" className="underline">
            Mercado
          </a>
          .
        </div>
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
