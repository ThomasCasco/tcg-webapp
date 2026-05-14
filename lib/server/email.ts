/**
 * Transactional email — server-side only.
 *
 * Uses Resend (https://resend.com).
 * Templates share a small layout helper so the brand looks consistent across
 * every notification. URLs always come from `getAppUrl()` so links work in
 * preview and production.
 */

import { Resend } from "resend";
import { getAppUrl } from "@/lib/shared/app-url";

function resendClient(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("Missing RESEND_API_KEY env var");
  return new Resend(key);
}

function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() ?? "TCG Marketplace <noreply@tcg.ar>";
}

function appUrl(): string {
  return getAppUrl();
}

function txUrl(transactionId: string): string {
  return `${appUrl()}/transactions/${encodeURIComponent(transactionId)}`;
}

function formatArs(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ────────────────────────────────────────────────────────────────────────────
// Shared layout
// ────────────────────────────────────────────────────────────────────────────

type LayoutParams = {
  preheader: string;
  title: string;
  intro: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

function layout(p: LayoutParams): string {
  const base = appUrl();
  const cta = p.ctaLabel && p.ctaUrl
    ? `<p style="text-align:center;margin:32px 0">
         <a href="${p.ctaUrl}" style="display:inline-block;background:#c47d2b;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">${escHtml(p.ctaLabel)}</a>
       </p>`
    : "";
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escHtml(p.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a">
  <span style="display:none;font-size:1px;color:#f5f0e8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escHtml(p.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.04);overflow:hidden">
        <tr><td style="padding:24px 28px 8px 28px">
          <p style="margin:0;font-size:12px;letter-spacing:1.5px;color:#c47d2b;text-transform:uppercase;font-weight:600">TCG Marketplace AR</p>
          <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.25;color:#1a1a1a">${escHtml(p.title)}</h1>
        </td></tr>
        <tr><td style="padding:16px 28px 4px 28px;font-size:15px;line-height:1.55;color:#333">${p.intro}</td></tr>
        <tr><td style="padding:8px 28px 16px 28px;font-size:15px;line-height:1.55;color:#333">${p.bodyHtml}</td></tr>
        <tr><td style="padding:0 28px">${cta}</td></tr>
        <tr><td style="padding:18px 28px 24px 28px;border-top:1px solid #f0e8da;color:#888;font-size:12px;line-height:1.5">
          ${p.footerNote ? `<p style="margin:0 0 8px 0">${p.footerNote}</p>` : ""}
          <p style="margin:0">TCG Marketplace AR · <a href="${base}" style="color:#c47d2b;text-decoration:none">${escHtml(base.replace(/^https?:\/\//, ""))}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function tableRow(label: string, value: string, emphasize = false): string {
  const bg = emphasize ? "background:#fbf7ef;" : "";
  const valueWeight = emphasize ? "font-weight:600;" : "";
  return `<tr style="${bg}">
    <td style="padding:10px 12px;border:1px solid #f0e8da;color:#666;font-size:14px">${escHtml(label)}</td>
    <td style="padding:10px 12px;border:1px solid #f0e8da;font-size:14px;${valueWeight}">${value}</td>
  </tr>`;
}

function tableHtml(rows: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 16px 0">${rows.join("")}</table>`;
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

export async function sendPaymentConfirmedBuyer(p: PaymentConfirmedBuyerParams): Promise<void> {
  const html = layout({
    preheader: `Tu pago por ${p.cardName} fue acreditado.`,
    title: "Pago confirmado",
    intro: `<p>Hola <strong>${escHtml(p.buyerName)}</strong>, tu pago por <strong>${escHtml(p.cardName)}</strong> ya fue acreditado.</p>`,
    bodyHtml: tableHtml([
      tableRow("Carta", `<strong>${escHtml(p.cardName)}</strong>`),
      tableRow("Monto", formatArs(p.priceArs), true),
    ]) + `<p>El vendedor ya recibió aviso y debería coordinar el envío o el retiro pronto.</p>`,
    ctaLabel: "Ver la operación",
    ctaUrl: txUrl(p.transactionId),
    footerNote: "¿Algún problema? Respondé este mail y te ayudamos.",
  });
  await sendMail(p.to, `Pago confirmado — ${p.cardName}`, html);
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

export async function sendSaleConfirmedSeller(p: SaleConfirmedSellerParams): Promise<void> {
  const html = layout({
    preheader: `${p.buyerName} pagó tu publicación.`,
    title: "Venta confirmada",
    intro: `<p>Hola <strong>${escHtml(p.sellerName)}</strong>, <strong>${escHtml(p.buyerName)}</strong> acaba de pagar por <strong>${escHtml(p.cardName)}</strong>.</p><p>El dinero ya está en tu cuenta de Mercado Pago.</p>`,
    bodyHtml: tableHtml([
      tableRow("Carta", `<strong>${escHtml(p.cardName)}</strong>`),
      tableRow("Precio bruto", formatArs(p.grossArs)),
      tableRow("Comisión plataforma (1 %)", `−${formatArs(p.platformFeeArs)}`),
      tableRow("<strong>Tu ingreso neto</strong>", `<strong>${formatArs(p.netArs)}</strong>`, true),
    ]) + `<p>Coordiná la entrega o el envío con el comprador desde la página de la operación.</p>`,
    ctaLabel: "Coordinar entrega",
    ctaUrl: txUrl(p.transactionId),
  });
  await sendMail(p.to, `Venta confirmada — ${p.cardName}`, html);
}

type ShippedBuyerParams = {
  to: string;
  buyerName: string;
  sellerName: string;
  cardName: string;
  tracking: string;
  transactionId: string;
};

export async function sendShippedToBuyer(p: ShippedBuyerParams): Promise<void> {
  const html = layout({
    preheader: `${p.sellerName} envió tu carta.`,
    title: "Tu carta ya viaja",
    intro: `<p>Hola <strong>${escHtml(p.buyerName)}</strong>, <strong>${escHtml(p.sellerName)}</strong> marcó como enviada tu compra de <strong>${escHtml(p.cardName)}</strong>.</p>`,
    bodyHtml: tableHtml([
      tableRow("Carta", `<strong>${escHtml(p.cardName)}</strong>`),
      tableRow("Tracking", `<code style="background:#f5f0e8;padding:2px 6px;border-radius:4px">${escHtml(p.tracking)}</code>`, true),
    ]) + `<p>Cuando llegue, confirmá la recepción para cerrar la operación.</p>`,
    ctaLabel: "Confirmar recepción cuando llegue",
    ctaUrl: txUrl(p.transactionId),
  });
  await sendMail(p.to, `Tu carta fue enviada — ${p.cardName}`, html);
}

type DeliveredSellerParams = {
  to: string;
  sellerName: string;
  buyerName: string;
  cardName: string;
  transactionId: string;
};

export async function sendDeliveredToSeller(p: DeliveredSellerParams): Promise<void> {
  const html = layout({
    preheader: `${p.buyerName} confirmó la entrega.`,
    title: "Entrega confirmada",
    intro: `<p>Hola <strong>${escHtml(p.sellerName)}</strong>, <strong>${escHtml(p.buyerName)}</strong> confirmó que recibió la carta.</p>`,
    bodyHtml: `<p><strong>${escHtml(p.cardName)}</strong> queda como operación entregada. Si el comprador califica la operación, vas a recibir aviso.</p>`,
    ctaLabel: "Ver la operación",
    ctaUrl: txUrl(p.transactionId),
  });
  await sendMail(p.to, `${p.buyerName} confirmó la entrega — ${p.cardName}`, html);
}

type DisputeOpenedParams = {
  to: string;
  recipientName: string;
  openedBy: string;
  cardName: string;
  reason: string;
  details: string;
  transactionId: string;
};

export async function sendDisputeOpened(p: DisputeOpenedParams): Promise<void> {
  const html = layout({
    preheader: `${p.openedBy} abrió una disputa.`,
    title: "Se abrió una disputa",
    intro: `<p>Hola <strong>${escHtml(p.recipientName)}</strong>, <strong>${escHtml(p.openedBy)}</strong> abrió una disputa sobre la operación de <strong>${escHtml(p.cardName)}</strong>.</p>`,
    bodyHtml: tableHtml([
      tableRow("Motivo", escHtml(p.reason)),
      tableRow("Detalles", escHtml(p.details).replace(/\n/g, "<br>")),
    ]) + `<p>Revisá la operación y respondé por el chat para intentar resolverlo. Si no llegan a acuerdo, el equipo de moderación interviene.</p>`,
    ctaLabel: "Ver la disputa",
    ctaUrl: txUrl(p.transactionId),
  });
  await sendMail(p.to, `Disputa abierta — ${p.cardName}`, html);
}

type RatingReceivedParams = {
  to: string;
  sellerName: string;
  buyerName: string;
  cardName: string;
  stars: number;
  comment?: string;
  transactionId: string;
};

export async function sendRatingReceived(p: RatingReceivedParams): Promise<void> {
  const starsRender = "★".repeat(p.stars) + "☆".repeat(5 - p.stars);
  const html = layout({
    preheader: `${p.buyerName} te puntuó con ${p.stars}/5.`,
    title: "Recibiste una calificación",
    intro: `<p>Hola <strong>${escHtml(p.sellerName)}</strong>, <strong>${escHtml(p.buyerName)}</strong> puntuó la operación de <strong>${escHtml(p.cardName)}</strong>.</p>`,
    bodyHtml: tableHtml([
      tableRow("Puntaje", `<span style="font-size:18px;color:#c47d2b;letter-spacing:2px">${starsRender}</span> · ${p.stars}/5`, true),
      ...(p.comment ? [tableRow("Comentario", escHtml(p.comment).replace(/\n/g, "<br>"))] : []),
    ]) + `<p>Esto suma a tu reputación pública. Gracias por mantener el marketplace sano.</p>`,
    ctaLabel: "Ver la operación",
    ctaUrl: txUrl(p.transactionId),
  });
  await sendMail(p.to, `Recibiste una calificación de ${p.buyerName}`, html);
}

// ────────────────────────────────────────────────────────────────────────────
// Internals
// ────────────────────────────────────────────────────────────────────────────

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const resend = resendClient();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
