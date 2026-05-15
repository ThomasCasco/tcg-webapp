import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import {
  getRatingByTransactionAndRater,
  getSellerReputationSummary,
  getTransactionWithListingForUser,
} from "@/lib/server/repository";
import { reconcileMpTransaction } from "@/lib/server/mp-reconcile";
import { OrderPanel } from "@/components/order-panel";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ArrowLeftRight } from "@/components/ui/icon";
import { log } from "@/lib/server/logger";

export const dynamic = "force-dynamic";

const PLATFORM_FEE_PERCENT =
  Number(process.env.PLATFORM_FEE_PERCENT ?? "1") / 100;

export default async function TransactionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mp_status?: string }>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { mp_status: mpStatus } = await searchParams;

  // Best-effort reconcile when buyer is bouncing back from MP success URL.
  if (mpStatus === "success") {
    try {
      await reconcileMpTransaction({ transactionId: id });
    } catch (err) {
      log.warn("transaction detail: reconcile failed", {
        tx: id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const tx = await getTransactionWithListingForUser(id, user.id);
  if (!tx) notFound();

  const isBuyer = tx.buyerId === user.id;
  const { getSupabaseAdminClient } = await import("@/lib/server/supabase");
  const sb = getSupabaseAdminClient();
  let listingPriceArs = 0;
  if (tx.listingId) {
    const { data } = await sb
      .from("market_listings")
      .select("price_ars")
      .eq("id", tx.listingId)
      .maybeSingle();
    if (data) listingPriceArs = Number((data as { price_ars: number }).price_ars);
  }

  const feeArs =
    typeof tx.fulfillmentStatus !== "undefined" && listingPriceArs
      ? Math.max(1, Math.round(listingPriceArs * PLATFORM_FEE_PERCENT))
      : 0;
  const netArs = Math.max(0, listingPriceArs - feeArs);

  const sellerRep = tx.sellerId ? await getSellerReputationSummary(tx.sellerId) : null;
  const existingRating = await getRatingByTransactionAndRater(tx.transactionId, user.id);

  const deliveryMode: "shipping" | "pickup" =
    tx.offersPickup && !tx.offersShipping ? "pickup" : "shipping";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-3 py-4 md:px-6 md:py-7">
      <header className="flex items-center justify-between">
        <Link
          href="/transactions"
          className="t-sm t-mute hover:text-[var(--ink)]"
        >
          ← Volver a transacciones
        </Link>
        <Chip size="sm" variant="info">
          {isBuyer ? "Compra" : "Venta"}
        </Chip>
      </header>

      <Card padding="lg">
        <p className="t-eyebrow">Operación</p>
        <h1 className="mt-1 text-h2 t-display">{tx.listingCardName ?? "Publicación"}</h1>
        {tx.listingSetName ? (
          <p className="mt-0.5 t-sm t-mute">{tx.listingSetName}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2 t-xs t-mute">
          <span>
            <ArrowLeftRight className="mr-1 inline h-3 w-3" />
            {isBuyer
              ? <>Vendedor: <strong className="text-[var(--ink)]">{tx.listingSellerHandle}</strong></>
              : <>Comprador: <strong className="text-[var(--ink)]">{tx.buyerHandle}</strong></>}
          </span>
          <span>·</span>
          <span>ID: <code className="t-mono">{tx.transactionId}</code></span>
          {sellerRep && sellerRep.count > 0 && isBuyer ? (
            <>
              <span>·</span>
              <span>
                Reputación vendedor:{" "}
                <strong className="text-[var(--ink)]">
                  ★ {sellerRep.average.toFixed(1)}
                </strong>{" "}
                ({sellerRep.count})
              </span>
            </>
          ) : null}
        </div>
      </Card>

      <OrderPanel
        transaction={{
          transactionId: tx.transactionId,
          listingId: tx.listingId,
          cardName: tx.listingCardName ?? "Publicación",
          provider: tx.provider,
          providerPaymentId: tx.providerPaymentId,
          verificationStatus: tx.verificationStatus,
          fulfillmentStatus: tx.fulfillmentStatus,
          shippingTracking: tx.shippingTracking,
          buyerHandle: tx.buyerHandle,
          sellerHandle: tx.listingSellerHandle ?? tx.sellerHandle ?? "",
          deliveryAreaNotes: tx.deliveryAreaNotes,
          createdAt: tx.createdAt,
          checkedAt: tx.checkedAt,
          priceArs: listingPriceArs,
          platformFeeArs: feeArs,
          netArs,
        }}
        viewerUserId={user.id}
        viewerIsBuyer={isBuyer}
        deliveryMode={deliveryMode}
        existingRating={existingRating}
      />
    </section>
  );
}
