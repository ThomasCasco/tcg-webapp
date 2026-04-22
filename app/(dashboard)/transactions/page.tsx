import { redirect } from "next/navigation";
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
      <TransactionFulfillmentForm />

      {loadError ? (
        <article className="surface-panel border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Error de backend: {loadError}
        </article>
      ) : null}

      <div className="surface-panel p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-black/55">Transacciones</p>
        <h1 className="mt-1 text-3xl [font-family:var(--font-display)]">Seguimiento post-venta</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {transactions.map((transaction) => (
          <article key={transaction.id} className="surface-panel p-5 text-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-black/55">{transaction.transactionId}</p>
            <p className="mt-1 font-semibold">Listing: {transaction.listingId}</p>
            <p className="text-black/70">Comprador: {transaction.buyerHandle}</p>
            <p className="text-black/70">Pago: {transaction.verificationStatus}</p>
            <p className="text-black/70">Fulfillment: {transaction.fulfillmentStatus ?? "pending"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
