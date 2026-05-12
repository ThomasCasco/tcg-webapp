import Link from "next/link";

export const metadata = {
  title: "Terminos y Condiciones",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-[var(--color-accent-strong)]">
        ← Volver
      </Link>
      <h1 className="mt-4 text-4xl [font-family:var(--font-display)]">
        Terminos y Condiciones
      </h1>
      <p className="mt-2 t-sm t-soft">
        Borrador beta · Ultima revision: 2026-04-21
      </p>

      <section className="prose prose-sm prose-invert mt-6 max-w-none space-y-4 text-[var(--ink-mute)]">
        <h2 className="text-xl font-semibold">1. Que es este servicio</h2>
        <p>
          TCG Marketplace AR es un <strong>clasificado online</strong> que
          permite a personas mayores de 18 años en Argentina publicar,
          descubrir y contactar vendedores de cartas coleccionables (TCG).
          No somos una casa de cambio, no somos procesador de pagos, no
          somos depositarios de mercaderia ni de dinero. Funcionamos en el
          mismo plano que un tablon de anuncios.
        </p>

        <h2 className="text-xl font-semibold">2. Pagos</h2>
        <p>
          Los pagos entre comprador y vendedor se realizan de manera
          directa, habitualmente via Mercado Pago. La plataforma unicamente{" "}
          <strong>registra la evidencia de esos pagos</strong> (ID de
          transaccion, estado informado por el proveedor, timestamps) con el
          fin de mediar disputas. No recibimos, retenemos ni transferimos
          fondos.
        </p>
        <p>
          El sistema de verificacion consulta al proveedor (Mercado Pago,
          Stripe) el estado del pago. Un estado &quot;verified&quot; indica
          unicamente que el proveedor confirma que ese pago existe y fue
          aprobado; no implica que la mercaderia haya sido entregada en
          conformidad.
        </p>

        <h2 className="text-xl font-semibold">3. Responsabilidad</h2>
        <p>
          La plataforma no es parte del contrato de compraventa entre
          usuarios. No garantizamos la autenticidad, condicion, entrega ni
          calidad de las cartas listadas. Cada usuario es responsable de la
          informacion que publica y de cumplir sus obligaciones fiscales
          (monotributo / IVA segun corresponda).
        </p>

        <h2 className="text-xl font-semibold">4. Sistema de disputas</h2>
        <p>
          Ofrecemos un proceso voluntario de disputa que permite a cualquiera
          de las partes registrar evidencia cuando la operacion no se
          concreto correctamente. Nuestras decisiones de moderacion{" "}
          <strong>no tienen caracter vinculante</strong> y no reemplazan los
          canales legales (Defensa del Consumidor, denuncia penal en caso de
          estafa).
        </p>

        <h2 className="text-xl font-semibold">5. Conducta prohibida</h2>
        <ul className="list-disc pl-6">
          <li>Publicar cartas falsificadas o robadas.</li>
          <li>
            Solicitar pagos fuera de los canales detectables (efectivo, cripto
            sin trazabilidad): limita nuestra capacidad de mediar disputas.
          </li>
          <li>Crear cuentas multiples para manipular reputacion o alertas.</li>
          <li>Recolectar datos personales de otros usuarios.</li>
        </ul>

        <h2 className="text-xl font-semibold">6. Datos personales</h2>
        <p>
          Guardamos email, username, IPs de conexion (rate-limit), historial
          de transacciones y eventuales documentos de identidad que el
          usuario decida subir. Tratamos los datos conforme a la Ley 25.326.
          Podes solicitar eliminacion escribiendo al canal de soporte.
        </p>

        <h2 className="text-xl font-semibold">7. Cambios</h2>
        <p>
          Podemos actualizar estos terminos y te avisaremos via email o
          notificacion in-app. Seguir usando la plataforma despues de un
          cambio implica aceptacion.
        </p>
      </section>
    </main>
  );
}
