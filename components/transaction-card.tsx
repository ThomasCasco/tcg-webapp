import Link from "next/link";
import type { PaymentEventWithListing } from "@/lib/domain/types";
import {
  fulfillmentLabelEs,
  verificationLabelEs,
} from "@/lib/shared/fulfillment-labels";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

type Props = {
  transaction: PaymentEventWithListing;
  viewerUserId: string;
};

// Summary only: every action (pay, ship, confirm, dispute, chat) lives on the
// transaction detail page so the rules are enforced in one place.
export function TransactionCard({ transaction, viewerUserId }: Props) {
  const isBuyer = transaction.buyerId === viewerUserId;
  const isPaid = transaction.verificationStatus === "verified";

  const verificationVariant: "success" | "warning" = isPaid ? "success" : "warning";
  const fulfillmentVariant: "success" | "warning" | "info" | "danger" =
    transaction.fulfillmentStatus === "delivered" || transaction.fulfillmentStatus === "closed"
      ? "success"
      : transaction.fulfillmentStatus === "shipped"
        ? "info"
        : transaction.fulfillmentStatus === "disputed"
          ? "danger"
          : "warning";

  return (
    <Card as="article" padding="md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-overline text-[var(--color-ink-subtle)]">
            {isBuyer ? "Compra" : "Venta"}
          </p>
          <h3 className="mt-0.5 truncate text-h3">
            {transaction.listingCardName ?? "Publicación"}
          </h3>
          {transaction.listingSetName && (
            <p className="text-caption text-[var(--color-ink-muted)]">
              {transaction.listingSetName}
            </p>
          )}
          <p className="mt-1 text-caption text-[var(--color-ink-muted)]">
            {isBuyer ? "Vendedor: " : "Comprador: "}
            <strong>{isBuyer ? transaction.listingSellerHandle : transaction.buyerHandle}</strong>
          </p>
        </div>
        <Link
          href={`/transactions/${transaction.transactionId}`}
          className="shrink-0 rounded-full border border-[var(--glass-border)] px-3 py-2 t-xs font-semibold hover:bg-[var(--glass-fill-hi)]"
        >
          Ver operación →
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip variant={verificationVariant} size="sm">
          Pago: {verificationLabelEs[transaction.verificationStatus] ?? transaction.verificationStatus}
        </Chip>
        {transaction.fulfillmentStatus && (
          <Chip variant={fulfillmentVariant} size="sm">
            {fulfillmentLabelEs[transaction.fulfillmentStatus] ?? transaction.fulfillmentStatus}
          </Chip>
        )}
        {transaction.shippingTracking && (
          <Chip variant="info" size="sm">
            Tracking: {transaction.shippingTracking}
          </Chip>
        )}
      </div>

      {!isPaid && (
        <p className="mt-3 text-caption text-[var(--color-ink-muted)]">
          {isBuyer
            ? "Esperando la confirmación de Mercado Pago. Si todavía no pagaste, entrá a la operación para pagar o cancelar la reserva."
            : "Esperando que el comprador pague por Mercado Pago. Te avisamos cuando se acredite."}
        </p>
      )}
    </Card>
  );
}
