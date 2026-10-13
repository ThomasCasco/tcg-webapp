import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  Layers,
  Package,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  Truck,
  Wallet,
} from "@/components/ui/icon";
import { getPlatformFeeConfig } from "@/lib/shared/platform-fee";
import { CHECKOUT_WINDOW_MINUTES } from "@/lib/shared/reservations";

export const dynamic = "force-static";

export const metadata = {
  title: "Cómo funciona",
  description:
    "Cómo comprar y vender cartas Pokémon en pesos: el pago va por Mercado Pago directo a la cuenta del vendedor, con seguimiento y reputación.",
};

const CONDITIONS: Array<{ title: string; body: string }> = [
  { title: "Mint / Casi mint (NM)", body: "Sin marcas visibles, como recién salida del sobre." },
  { title: "Ligeramente jugada (LP)", body: "Marcas leves en bordes o esquinas, sin dobleces." },
  { title: "Moderadamente jugada", body: "Desgaste visible en bordes y superficie, sin roturas." },
  { title: "Muy jugada (HP)", body: "Desgaste fuerte; puede tener pliegues leves." },
  { title: "Dañada", body: "Roturas, dobleces marcados, manchas o daño por agua." },
];

export default function HowItWorksPage() {
  const fee = getPlatformFeeConfig();
  const feeText =
    fee.percent > 0
      ? `TCG cobra ${fee.percent} % por venta${fee.minArs > 0 ? ` (mínimo ARS ${fee.minArs.toLocaleString("es-AR")})` : ""}. Mercado Pago cobra aparte su comisión al vendedor, según el plazo de acreditación de su cuenta.`
      : "Durante el lanzamiento TCG no cobra comisión. Mercado Pago cobra la suya al vendedor, según el plazo de acreditación de su cuenta.";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 py-10 md:py-14">
      <header className="text-center">
        <p className="text-overline text-[var(--color-ink-subtle)]">Guía rápida</p>
        <h1 className="mt-2 text-display-md [font-family:var(--font-display)] md:text-display-lg">
          Cómo funciona
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-body-md text-[var(--color-ink-muted)]">
          Comprás y vendés cartas Pokémon en pesos. El pago va por Mercado Pago, directo a la
          cuenta del vendedor, y cada compra queda registrada con su seguimiento.
        </p>
      </header>

      <section className="space-y-4">
        <SectionHeading
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Comprar"
          subtitle="De encontrar la carta a tenerla en la mano."
        />
        <ol className="grid gap-3 md:grid-cols-4">
          <Step n={1} title="Encontrás la carta">
            Buscala por nombre o set. Mirá las fotos, la condición y la reputación del vendedor.
          </Step>
          <Step n={2} title="Pagás con Mercado Pago">
            La carta queda reservada {CHECKOUT_WINDOW_MINUTES} minutos mientras pagás. El pago va
            directo al vendedor y se confirma solo.
          </Step>
          <Step n={3} title="La recibís">
            Seguís el envío con el número de tracking o coordinás el retiro por el chat de la
            compra.
          </Step>
          <Step n={4} title="Confirmás y calificás">
            Cuando la tenés, confirmás la recepción y calificás al vendedor.
          </Step>
        </ol>
      </section>

      <section className="space-y-4">
        <SectionHeading
          icon={<Tag className="h-5 w-5" />}
          title="Vender"
          subtitle="Lo que necesitás para publicar tu primera carta."
        />
        <ol className="grid gap-3 md:grid-cols-4">
          <Step n={1} title="Conectás Mercado Pago">
            Una sola vez. Los compradores te pagan directo a tu cuenta.
          </Step>
          <Step n={2} title="Cargás la carta">
            Buscala en el catálogo, sacale foto de frente y dorso, elegí la condición y el precio.
          </Step>
          <Step n={3} title="La publicás">
            Indicás si hacés envío, retiro en persona o ambos, y desde qué zona.
          </Step>
          <Step n={4} title="Despachás">
            Cuando la venta figura como pagada, enviás y cargás el tracking, o la entregás en
            persona.
          </Step>
        </ol>
      </section>

      <section id="pagos" className="space-y-4">
        <SectionHeading
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Pagos y seguridad"
          subtitle="Las reglas que te cuidan, sin letra chica."
        />
        <div className="grid gap-3 md:grid-cols-2">
          <MiniInfo
            icon={<Wallet className="h-4 w-4 text-[var(--accent-hi)]" />}
            title="TCG no toca tu plata"
            body="El pago va de la cuenta del comprador a la del vendedor por Mercado Pago. No hay saldo guardado en la plataforma."
          />
          <MiniInfo
            icon={<CreditCard className="h-4 w-4 text-[var(--accent-hi)]" />}
            title="Pagá solo desde el botón de compra"
            body="Si alguien te pide una transferencia o un pago por afuera, no lo hagas. Fuera de la app no podemos ayudarte."
          />
          <MiniInfo
            icon={<Truck className="h-4 w-4 text-[var(--accent-hi)]" />}
            title="Vendedor: despachá con el pago acreditado"
            body="Enviá o entregá la carta solo cuando la operación diga «Pago acreditado»."
          />
          <MiniInfo
            icon={<Scale className="h-4 w-4 text-[var(--accent-hi)]" />}
            title="Si algo sale mal"
            body="Abrí una disputa desde la operación. Queda registrada y afecta la reputación de quien no cumplió."
          />
          <MiniInfo
            icon={<Star className="h-4 w-4 text-[var(--accent-hi)]" />}
            title="Reputación real"
            body="Solo suman las compras pagadas por la app, así que no se puede inflar con ventas por afuera."
          />
          <MiniInfo
            icon={<Package className="h-4 w-4 text-[var(--accent-hi)]" />}
            title="Comisión"
            body={feeText}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          icon={<Layers className="h-5 w-5" />}
          title="Condición de las cartas"
          subtitle="Qué significa cada estado, para comprar sin sorpresas."
        />
        <div className="grid gap-3 md:grid-cols-3">
          {CONDITIONS.map((condition) => (
            <MiniInfo
              key={condition.title}
              icon={<CheckCircle className="h-4 w-4 text-[var(--accent-hi)]" />}
              title={condition.title}
              body={condition.body}
            />
          ))}
        </div>
      </section>

      <Card padding="lg" className="flex flex-col items-center gap-3 text-center">
        <p className="text-h3">¿Arrancamos?</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/market">
              Ir al mercado
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </div>
      </Card>
    </main>
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
      <div className="grid h-10 w-10 place-items-center rounded-[var(--r-xs)] border border-[var(--glass-border)] bg-[var(--bg-2)] text-[var(--accent-hi)]">
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
    <li className="glass-soft rounded-[var(--r-md)] p-3">
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
    <div className="glass-soft rounded-[var(--r-md)] p-3">
      <div className="flex items-center gap-2 text-body-sm font-semibold">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-caption text-[var(--color-ink-muted)]">{body}</p>
    </div>
  );
}
