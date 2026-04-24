import { reserveListing } from "@/lib/server/repository";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`listing-reserve:${user.id}:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many requests. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const { id } = await context.params;

  try {
    const result = await reserveListing({
      listingId: id,
      buyerId: user.id,
      buyerHandle: user.username,
    });

    const hasSellerPaymentData = Boolean(
      result.sellerPayment.paymentAlias ||
        result.sellerPayment.whatsapp ||
        result.sellerPayment.paymentInstructions,
    );

    return Response.json({
      listing: result.listing,
      transactionId: result.transactionId,
      sellerPayment: result.sellerPayment,
      message: hasSellerPaymentData
        ? "Reserva creada. Pagá al vendedor con los datos de abajo y después verificá el pago en Transacciones."
        : "Reserva creada: el vendedor aún no cargó datos de cobro. Coordiná antes de transferir.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reserve listing.";
    const status = message === "Listing is not available." ? 409 : 500;

    return Response.json({ error: message }, { status });
  }
}
