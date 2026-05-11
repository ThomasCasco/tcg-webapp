import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  ArrowLeftRight,
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle,
  CreditCard,
  Gavel,
  Info,
  Layers,
  Package,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wallet,
} from "@/components/ui/icon";

export const dynamic = "force-static";

export const metadata = {
  title: "Cómo funciona — TCG",
  description:
    "Tres modalidades para mover tu colección: marketplace, intercambios y subastas. Cómo pagar y cobrar, qué garantías hay y qué tenés que tener listo para vender.",
};

export default function HowItWorksPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-10 md:py-14">
      <header className="text-center">
        <p className="text-overline text-[var(--color-ink-subtle)]">Guía rápida</p>
        <h1 className="mt-2 text-display-md [font-family:var(--font-display)] md:text-display-lg">
          Cómo funciona TCG
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-body-md text-[var(--color-ink-muted)]">
          Tres maneras de mover tu colección. Si recién llegás, esta es la
          versión sin vueltas: para qué sirve cada cosa, cómo se paga y qué
          pasa si algo sale mal.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <ModeCard
          icon={<ShoppingBag className="h-6 w-6" />}
          eyebrow="Modalidad 1"
          title="Marketplace"
          subtitle="Comprar y vender a precio fijo"
          body="El vendedor publica una carta con un precio en pesos. El comprador la reserva y paga. Es la forma más directa."
          href="/market"
          cta="Ir al mercado"
        />
        <ModeCard
          icon={<ArrowLeftRight className="h-6 w-6" />}
          eyebrow="Modalidad 2"
          title="Intercambios (P2P)"
          subtitle="Cambiar cartas, sin dinero"
          body="Marcás cartas como disponibles para intercambio. Otro coleccionista te propone un swap. Si los dos confirman que el cambio se hizo, listo."
          href="/trades"
          cta="Ver trades"
        />
        <ModeCard
          icon={<Gavel className="h-6 w-6" />}
          eyebrow="Modalidad 3"
          title="Subastas"
          subtitle="Pujas con cierre por tiempo"
          body="El vendedor define precio inicial y duración. Los compradores pujan. Podés programar una subasta y los seguidores se anotan para cuando arranque."
          href="/auctions"
          cta="Ver subastas"
        />
      </section>

      <section id="marketplace" className="space-y-4">
        <SectionHeading
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Marketplace"
          subtitle="El flujo de compra estándar"
        />

        <Card padding="lg" className="space-y-4">
          <h3 className="text-h3">Si comprás</h3>
          <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Step n={1} title="Buscás">Filtros por carta, condición y entrega.</Step>
            <Step n={2} title="Reservás">La publicación queda a tu nombre por 24 h.</Step>
            <Step n={3} title="Pagás">
              Si el vendedor tiene Mercado Pago, se verifica solo. Si no, coordinás P2P.
            </Step>
            <Step n={4} title="Recibís">
              Coordinás envío o retiro por el chat de la operación.
            </Step>
          </ol>
        </Card>

        <Card padding="lg" className="space-y-4">
          <h3 className="text-h3">Si vendés</h3>
          <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Step n={1} title="Cargás stock">Carga tu carta en Inventario con foto y condición.</Step>
            <Step n={2} title="Publicás">Definís precio, envío y zona de retiro.</Step>
            <Step n={3} title="Cobrás">Mercado Pago automático si lo conectaste; sino, alias o CBU.</Step>
            <Step n={4} title="Entregás">Confirmás cuando despachás. Cierre cuando el comprador recibe.</Step>
          </ol>
        </Card>
      </section>

      <section id="pagos" className="space-y-4">
        <SectionHeading
          icon={<Wallet className="h-5 w-5" />}
          title="Mercado Pago vs P2P"
          subtitle="La diferencia clave que afecta cada compra"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card padding="lg" className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-[var(--radius-card)] bg-[var(--color-success-soft)] text-[var(--color-success)]">
                <CreditCard className="h-4 w-4" />
              </div>
              <Chip variant="success">Verificación automática</Chip>
            </div>
            <h3 className="text-h3">Mercado Pago conectado</h3>
            <p className="text-body-sm text-[var(--color-ink-muted)]">
              El vendedor conectó su cuenta de Mercado Pago a TCG. Cuando reservás
              te abre el checkout de MP. Apenas confirma el pago, nuestra plataforma
              verifica con MP directamente: la operación queda lista para envío sin
              intervención manual.
            </p>
            <ul className="space-y-1.5 text-body-sm text-[var(--color-ink-muted)]">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--color-success)]" />
                Sin captura de pantalla, sin esperas.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--color-success)]" />
                Ves el estado del pago en tu operación.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--color-success)]" />
                Disputa fácil si algo sale mal.
              </li>
            </ul>
          </Card>

          <Card padding="lg" className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-[var(--radius-card)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
              <Chip variant="warning">Pago acordado</Chip>
            </div>
            <h3 className="text-h3">P2P (sin MP conectado)</h3>
            <p className="text-body-sm text-[var(--color-ink-muted)]">
              El vendedor todavía no conectó MP. Te muestra alias, CBU o un link
              para pagarle. Vos transferís, le mandás el comprobante por el chat
              y confirman manualmente que el pago llegó. La plataforma no media:
              importa la reputación de cada uno.
            </p>
            <ul className="space-y-1.5 text-body-sm text-[var(--color-ink-muted)]">
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-[var(--color-warning)]" />
                Revisá la reputación del vendedor antes de pagar.
              </li>
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-[var(--color-warning)]" />
                Usá el chat de la operación, no afuera de la plataforma.
              </li>
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-[var(--color-warning)]" />
                Si algo sale mal, abrís disputa desde la operación.
              </li>
            </ul>
          </Card>
        </div>

        <Card padding="md" className="border-[var(--color-accent)] bg-[var(--color-accent-soft)]">
          <p className="text-body-sm text-[var(--color-accent-strong)]">
            <ShieldCheck className="mr-1 inline h-4 w-4" />
            En cada listing vas a ver un sello que dice si el vendedor tiene MP
            conectado o si la operación va a ser P2P. Mirá el sello antes de
            reservar para saber qué esperar.
          </p>
        </Card>
      </section>

      <section id="trades" className="space-y-4">
        <SectionHeading
          icon={<ArrowLeftRight className="h-5 w-5" />}
          title="Intercambios (Trades)"
          subtitle="Cambiar cartas sin pagar"
        />

        <Card padding="lg" className="space-y-3">
          <p className="text-body-sm text-[var(--color-ink-muted)]">
            Si tenés repetidas o estás juntando una colección, podés marcar tus
            cartas como disponibles para trade y publicar las que buscás. Otros
            coleccionistas te mandan propuestas; vos aceptás o declinás.
          </p>
          <ol className="grid gap-3 md:grid-cols-4">
            <Step n={1} title="Marcás">Disponibilidad para trade en tu inventario.</Step>
            <Step n={2} title="Recibís">Propuesta de un coleccionista.</Step>
            <Step n={3} title="Aceptás">Coordinan envío o encuentro.</Step>
            <Step n={4} title="Confirman">Los dos confirman que el intercambio se hizo.</Step>
          </ol>
          <p className="text-body-sm text-[var(--color-ink-muted)]">
            La aceptación no transfiere nada solita: el inventario se mueve solo
            cuando las dos partes confirman. Esto evita problemas si una persona
            se arrepiente.
          </p>
        </Card>
      </section>

      <section id="subastas" className="space-y-4">
        <SectionHeading
          icon={<Gavel className="h-5 w-5" />}
          title="Subastas"
          subtitle="Pujas con cierre por tiempo"
        />

        <Card padding="lg" className="space-y-3">
          <h3 className="text-h3 flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Subastas programadas
          </h3>
          <p className="text-body-sm text-[var(--color-ink-muted)]">
            Cuando un vendedor crea una subasta puede ponerla a empezar
            inmediatamente o programarla para una fecha futura. Las programadas
            aparecen en &quot;Próximas subastas&quot; con cuenta regresiva.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <MiniInfo
              icon={<Bell className="h-4 w-4" />}
              title="Avisame"
              body="Tocás el botón y te llega notificación in-app cuando arranca."
            />
            <MiniInfo
              icon={<Gavel className="h-4 w-4" />}
              title="Pujás"
              body="Cuando arranca, cada puja sube el precio según el incremento del vendedor."
            />
            <MiniInfo
              icon={<CheckCircle className="h-4 w-4" />}
              title="Ganás"
              body="Al cierre, la mayor oferta se lleva la carta. Pago igual que el marketplace."
            />
          </div>
          <Button asChild variant="secondary">
            <Link href="/auctions">
              Ver próximas subastas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>

      <section id="setup" className="space-y-4">
        <SectionHeading
          icon={<Package className="h-5 w-5" />}
          title="Antes de vender"
          subtitle="Lo que necesitás tener listo"
        />

        <Card padding="lg" className="space-y-3">
          <ul className="space-y-2 text-body-sm">
            <li className="flex items-start gap-2">
              <Layers className="mt-0.5 h-4 w-4 text-[var(--color-ink-muted)]" />
              <span>
                <strong>Perfil completo</strong> (foto, ubicación, contacto). Genera confianza.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Wallet className="mt-0.5 h-4 w-4 text-[var(--color-ink-muted)]" />
              <span>
                <strong>Método de cobro</strong>: lo ideal es Mercado Pago conectado
                (cobros automáticos), aunque podés vender con alias o CBU como alternativa.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Truck className="mt-0.5 h-4 w-4 text-[var(--color-ink-muted)]" />
              <span>
                <strong>Cómo entregás</strong>: envío, retiro, o ambos. Aclará zona y costos.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Package className="mt-0.5 h-4 w-4 text-[var(--color-ink-muted)]" />
              <span>
                <strong>Foto real</strong> de cada carta. Sin foto, las publicaciones
                rinden mucho menos.
              </span>
            </li>
          </ul>
        </Card>
      </section>

      <section id="disputas" className="space-y-4">
        <SectionHeading
          icon={<Scale className="h-5 w-5" />}
          title="Si algo sale mal"
          subtitle="Disputas y reputación"
        />
        <Card padding="lg" className="space-y-3">
          <p className="text-body-sm text-[var(--color-ink-muted)]">
            Cada operación tiene un botón para abrir disputa. La plataforma no
            congela plata (los pagos van directo entre las partes), pero las
            disputas afectan reputación y quedan registradas. Esto incentiva a
            todos a comportarse bien.
          </p>
        </Card>
      </section>

      <section className="text-center">
        <p className="text-body-md text-[var(--color-ink-muted)]">
          ¿Listo para empezar?
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <Button asChild size="lg">
            <Link href="/market">
              <ShoppingBag className="h-4 w-4" />
              Ir al mercado
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function ModeCard({
  icon,
  eyebrow,
  title,
  subtitle,
  body,
  href,
  cta,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-card)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]">
        {icon}
      </div>
      <div>
        <p className="text-overline text-[var(--color-ink-subtle)]">{eyebrow}</p>
        <h2 className="mt-1 text-h2 [font-family:var(--font-display)]">{title}</h2>
        <p className="mt-1 text-body-sm font-semibold text-[var(--color-ink)]">{subtitle}</p>
      </div>
      <p className="text-body-sm text-[var(--color-ink-muted)]">{body}</p>
      <div className="mt-auto">
        <Button asChild variant="secondary">
          <Link href={href}>
            {cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-card)] bg-[var(--color-ink)] text-white">
        {icon}
      </div>
      <div>
        <h2 className="text-h2 [font-family:var(--font-display)]">{title}</h2>
        <p className="text-body-sm text-[var(--color-ink-muted)]">{subtitle}</p>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-[var(--radius-card)] bg-[var(--color-surface-muted)] p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-accent)] text-[0.75rem] font-bold text-white">
          {n}
        </span>
        <p className="text-body-sm font-semibold">{title}</p>
      </div>
      <p className="mt-1 text-caption text-[var(--color-ink-muted)]">{children}</p>
    </li>
  );
}

function MiniInfo({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-muted)] p-3">
      <div className="flex items-center gap-2 text-body-sm font-semibold">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-caption text-[var(--color-ink-muted)]">{body}</p>
    </div>
  );
}
