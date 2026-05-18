import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TransactionChat } from "@/components/transaction-chat";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Scale } from "@/components/ui/icon";
import { getAuthenticatedUser } from "@/lib/server/auth";
import {
  getTransactionWithListingForUser,
  listDisputesForUser,
} from "@/lib/server/repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const statusLabel = {
  open: "Abierta",
  investigating: "En revisión",
  resolved: "Resuelta",
  rejected: "Rechazada",
} as const;

export default async function DisputeDetailPage({ params }: PageProps) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const disputes = await listDisputesForUser(user.id);
  const dispute = disputes.find((item) => item.id === id);
  if (!dispute) notFound();

  const transaction = await getTransactionWithListingForUser(dispute.transactionId, user.id);
  const openedAt = new Date(dispute.createdAt).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-3 py-4 md:px-6 md:py-7">
      <header className="flex items-center justify-between gap-3">
        <Link href="/disputes" className="t-sm t-mute hover:text-[var(--ink)]">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Volver a disputas
        </Link>
        <Chip size="sm" variant={dispute.status === "open" ? "warning" : "info"}>
          {statusLabel[dispute.status]}
        </Chip>
      </header>

      <Card padding="lg">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-xs)] border border-[var(--glass-border)] bg-[var(--bg-2)] text-[var(--accent-hi)]">
            <Scale className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="t-eyebrow">Caso de disputa</p>
            <h1 className="mt-1 text-h2 t-display">{dispute.reason}</h1>
            <p className="mt-1 t-sm t-mute">
              Abierta por @{dispute.openedByHandle} el {openedAt}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-4">
          <p className="t-eyebrow">Detalle declarado</p>
          <p className="mt-2 whitespace-pre-wrap t-sm text-[var(--ink)]">{dispute.details}</p>
        </div>
      </Card>

      <Card padding="md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="t-eyebrow">Operación asociada</p>
            <h2 className="mt-1 text-h3">
              {transaction?.listingCardName ?? "Transacción"}{" "}
              <span className="t-sm font-normal t-mute">#{dispute.transactionId}</span>
            </h2>
            {transaction?.listingSellerHandle ? (
              <p className="mt-1 t-sm t-mute">
                Vendedor @{transaction.listingSellerHandle} · Comprador @{transaction.buyerHandle}
              </p>
            ) : null}
          </div>
          <Button asChild variant="secondary">
            <Link href={`/transactions/${dispute.transactionId}`}>
              Ver operación
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>

      <Card padding="md">
        <p className="t-eyebrow">Conversación</p>
        <p className="mt-1 t-sm t-mute">
          Usá este hilo para dejar contexto y coordinar próximos pasos. Todo queda ligado a la operación.
        </p>
        <div className="mt-4">
          <TransactionChat transactionId={dispute.transactionId} viewerUserId={user.id} />
        </div>
      </Card>
    </section>
  );
}
