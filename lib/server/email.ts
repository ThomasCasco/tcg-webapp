/**
 * Transactional email — server-side only.
 *
 * Uses Resend (https://resend.com).
 * Templates are plain HTML strings so there's no template engine dependency.
 * All currency amounts are formatted as ARS with locale "es-AR".
 */

import { Resend } from "resend";

function resendClient(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("Missing RESEND_API_KEY env var");
  return new Resend(key);
}

function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() ?? "TCG Marketplace <noreply@tcg.ar>";
}

function appUrl(): string {
  return (process.env.APP_URL ?? "https://tcg.ar").replace(/\/$/, "");
}

function formatArs(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ────────────────────────────────────────────────────────────────────────────
// Email templates
// ────────────────────────────────────────────────────────────────────────────

type PaymentConfirmedBuyerParams = {
  to: string;
  buyerName: string;
  cardName: string;
  priceArs: number;
  transactionId: string;
};

function paymentConfirmedBuyerHtml(p: PaymentConfirmedBuyerParams): string {
  const txUrl = `${appUrl()}/transactions`;
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Pago confirmado</title></head>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:1.5rem;margin-bottom:8px;color:#1a1a1a">Pago confirmado</h1>
  <p>Hola <strong>${escHtml(p.buyerName)}</strong>,</p>
  <p>Tu pago por <strong>${escHtml(p.cardName)}</strong> fue procesado exitosamente.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr>
      <td style="padding:8px;border:1px solid #e0d8cc">Carta</td>
      <td style="padding:8px;border:1px solid #e0d8cc"><strong>${escHtml(p.cardName)}</strong></td>
    </tr>
    <tr>
      <td style="padding:8px;border:1px solid #e0d8cc">Monto</td>
      <td style="padding:8px;border:1px solid #e0d8cc"><strong>${formatArs(p.priceArs)}</strong></td>
    </tr>
  </table>
  <p>El vendedor coordinará el envío o retiro. Podés seguir tu transacción en:</p>
  <p>
    <a href="${txUrl}" style="display:inline-block;background:#c47d2b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
      Ver transacción
    </a>
  </p>
  <p style="color:#666;font-size:0.85rem;margin-top:32px">
    TCG Marketplace AR · <a href="${appUrl()}" style="color:#c47d2b">${appUrl()}</a>
  </p>
</body>
</html>`;
}

type SaleConfirmedSellerParams = {
  to: string;
  sellerName: string;
  buyerName: string;
  cardName: string;
  grossArs: number;
  platformFeeArs: number;
  netArs: number;
  transactionId: string;
};

function saleConfirmedSellerHtml(p: SaleConfirmedSellerParams): string {
  const txUrl = `${appUrl()}/transactions`;
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Venta confirmada</title></head>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:1.5rem;margin-bottom:8px;color:#1a1a1a">Venta confirmada</h1>
  <p>Hola <strong>${escHtml(p.sellerName)}</strong>,</p>
  <p><strong>${escHtml(p.buyerName)}</strong> acaba de pagar por <strong>${escHtml(p.cardName)}</strong>.</p>
  <p>El dinero ya está en tu cuenta de Mercado Pago.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr>
      <td style="padding:8px;border:1px solid #e0d8cc">Carta</td>
      <td style="padding:8px;border:1px solid #e0d8cc"><strong>${escHtml(p.cardName)}</strong></td>
    </tr>
    <tr>
      <td style="padding:8px;border:1px solid #e0d8cc">Precio bruto</td>
      <td style="padding:8px;border:1px solid #e0d8cc">${formatArs(p.grossArs)}</td>
    </tr>
    <tr>
      <td style="padding:8px;border:1px solid #e0d8cc">Comisión plataforma (1&nbsp;%)</td>
      <td style="padding:8px;border:1px solid #e0d8cc">−${formatArs(p.platformFeeArs)}</td>
    </tr>
    <tr style="background:#f5f0e8">
      <td style="padding:8px;border:1px solid #e0d8cc"><strong>Tu ingreso neto</strong></td>
      <td style="padding:8px;border:1px solid #e0d8cc"><strong>${formatArs(p.netArs)}</strong></td>
    </tr>
  </table>
  <p>Por favor coordiná la entrega / envío con el comprador:</p>
  <p>
    <a href="${txUrl}" style="display:inline-block;background:#c47d2b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
      Ver transacción
    </a>
  </p>
  <p style="color:#666;font-size:0.85rem;margin-top:32px">
    TCG Marketplace AR · <a href="${appUrl()}" style="color:#c47d2b">${appUrl()}</a>
  </p>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────────────────────
// Public send helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Send payment confirmation to the buyer.
 */
export async function sendPaymentConfirmedBuyer(
  params: PaymentConfirmedBuyerParams,
): Promise<void> {
  const resend = resendClient();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: params.to,
    subject: `Pago confirmado — ${params.cardName}`,
    html: paymentConfirmedBuyerHtml(params),
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

/**
 * Send sale confirmation to the seller with net breakdown.
 */
export async function sendSaleConfirmedSeller(
  params: SaleConfirmedSellerParams,
): Promise<void> {
  const resend = resendClient();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: params.to,
    subject: `Venta confirmada — ${params.cardName}`,
    html: saleConfirmedSellerHtml(params),
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

// ────────────────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
