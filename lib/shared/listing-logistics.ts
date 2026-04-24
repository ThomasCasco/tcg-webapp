/**
 * Reglas mínimas para que comprador y vendedor sepan cómo se entrega la carta (P2P).
 */
export function assertListingLogisticsValid(
  offersShipping: boolean,
  offersPickup: boolean,
  deliveryAreaNotes: string | null | undefined,
): void {
  const notes = (deliveryAreaNotes ?? "").trim();
  if (!offersShipping && !offersPickup) {
    throw new Error(
      "Indicá si ofrecés envío, retiro en persona o ambos. Así el comprador sabe qué esperar.",
    );
  }
  if (notes.length < 8) {
    throw new Error(
      "Describí dónde y cómo (mín. 8 caracteres). Ej.: «Retiro Caballito CABA, lun a vie 18–21 h» o «Envío Andreani a todo el país, costo a cargo del comprador».",
    );
  }
}
