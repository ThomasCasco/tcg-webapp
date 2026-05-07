import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Privacidad",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-8 md:py-12">
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">Legal</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Política de privacidad
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Esta versión beta guarda solo los datos necesarios para operar el
          marketplace, proteger cuentas y dejar evidencia de transacciones.
        </p>
      </Card>

      <Card as="section" padding="lg" className="space-y-5 text-body-sm text-[var(--color-ink-muted)]">
        <section>
          <h2 className="text-h3 text-[var(--color-ink)]">Datos que guardamos</h2>
          <p className="mt-2">
            Cuenta, email, nombre público, perfil, inventario, publicaciones,
            alertas, propuestas de trade, transacciones, mensajes ligados a una
            operación, datos de entrega y evidencia de disputas.
          </p>
        </section>

        <section>
          <h2 className="text-h3 text-[var(--color-ink)]">Pagos</h2>
          <p className="mt-2">
            La plataforma no custodia fondos. Cuando se usa Mercado Pago,
            guardamos identificadores técnicos de la operación para verificar el
            estado del pago y mostrarlo a comprador y vendedor.
          </p>
        </section>

        <section>
          <h2 className="text-h3 text-[var(--color-ink)]">Seguridad y moderación</h2>
          <p className="mt-2">
            Podemos usar historial de operaciones, disputas, rate limits e IPs
            técnicas para detectar abuso, fraude o spam. Si se activa
            verificación de identidad, los documentos deberán guardarse con
            acceso restringido y revisión manual.
          </p>
        </section>

        <section>
          <h2 className="text-h3 text-[var(--color-ink)]">Tus opciones</h2>
          <p className="mt-2">
            Podés editar tu perfil, borrar alertas y cancelar publicaciones
            activas desde la app. Para pedidos de baja de cuenta o revisión de
            datos, contactá al soporte del proyecto.
          </p>
        </section>
      </Card>
    </main>
  );
}
