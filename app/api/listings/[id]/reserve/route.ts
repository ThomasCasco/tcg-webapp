/**
 * POST /api/listings/:id/reserve — retired.
 *
 * This was the alias/CBU (P2P) reservation path: no payment verification and
 * no commission. Every purchase now goes through POST /api/payments/checkout.
 */

export async function POST() {
  return Response.json(
    { error: "Las compras se hacen solo con Mercado Pago desde la publicación." },
    { status: 410 },
  );
}
