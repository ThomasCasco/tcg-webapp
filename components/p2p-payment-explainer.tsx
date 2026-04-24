export function P2pPaymentExplainer() {
  return (
    <article className="surface-panel border border-[var(--color-border)] bg-white/70 p-5 text-sm text-black/75">
      <p className="text-xs uppercase tracking-[0.12em] text-black/55">
        Cómo funciona el pago entre personas
      </p>
      <h2 className="mt-1 text-lg font-semibold text-black/90">
        No retenemos el dinero (no somos billetera)
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>
          El comprador paga <strong>directo al vendedor</strong> (Mercado Pago, transferencia, etc.)
          usando los datos que figuran en la reserva.
        </li>
        <li>
          Cuando pegás el <strong>ID de pago de Mercado Pago</strong> (o el comprobante según el flujo),
          nuestro servidor <strong>consulta la API del proveedor</strong>: si el pago figura como
          aprobado/acreditado, marcamos la operación como <em>verificada</em>. Eso no mueve plata:
          solo lee el estado público del pago.
        </li>
        <li>
          <strong>«Pago verificado»</strong> significa: &quot;el proveedor confirma que ese ID existe y
          está en un estado exitoso&quot;. El envío o el retiro se coordinan después entre ustedes
          (estados de envío / entregado en esta misma pantalla).
        </li>
        <li>
          Si el pago es por <strong>link externo o transferencia sin API</strong>, puede quedar en{" "}
          <em>pendiente de revisión</em>: ahí conviene subir comprobante y acordar por chat.
        </li>
      </ul>
      <p className="mt-3 text-xs text-black/60">
        Para custodia real (plata retenida hasta que llegue el paquete) necesitás integración tipo{" "}
        <strong>Mercado Pago Marketplace</strong> u otro escrow regulado: es otro producto y
        requisitos legales distintos.
      </p>
    </article>
  );
}
