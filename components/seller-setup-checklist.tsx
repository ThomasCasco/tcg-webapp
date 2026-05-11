import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Check, CircleDashed, ArrowRight } from "@/components/ui/icon";

export type ChecklistStep = {
  key: string;
  title: string;
  description: string;
  href: string;
  done: boolean;
  cta?: string;
};

type Props = {
  steps: ChecklistStep[];
  title?: string;
  subtitle?: string;
};

export function SellerSetupChecklist({
  steps,
  title = "Configurá tu cuenta para vender",
  subtitle = "Estos pasos te dan más chances de vender y construir reputación.",
}: Props) {
  const done = steps.filter((step) => step.done).length;
  const total = steps.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = done === total;

  if (complete) {
    return (
      <Card padding="md" className="border-[var(--color-success)] bg-[var(--color-success-soft)]">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-success)] text-white">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="text-body-sm font-semibold text-[var(--color-success)]">
              Setup completo
            </p>
            <p className="text-caption text-[var(--color-ink-muted)]">
              Estás listo para vender. Si querés, ya podés{" "}
              <Link href="/listings" className="font-semibold underline">
                publicar una carta
              </Link>{" "}
              o{" "}
              <Link href="/my-auctions" className="font-semibold underline">
                crear una subasta
              </Link>
              .
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-overline text-[var(--color-ink-subtle)]">Setup vendedor</p>
          <h2 className="mt-1 text-h3">{title}</h2>
          <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-h2 font-bold">{percent}%</p>
          <p className="text-caption text-[var(--color-ink-muted)]">
            {done} de {total} pasos
          </p>
        </div>
      </header>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.key}
            className={`flex items-start gap-3 rounded-[var(--radius-card)] border p-3 transition-colors ${
              step.done
                ? "border-[var(--color-success)] bg-[var(--color-success-soft)]/40"
                : "border-[var(--color-border-default)] bg-white hover:border-[var(--color-accent)]"
            }`}
          >
            <div
              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                step.done
                  ? "bg-[var(--color-success)] text-white"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-ink-subtle)]"
              }`}
              aria-hidden
            >
              {step.done ? <Check className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-body-sm font-semibold">{step.title}</p>
                {step.done ? (
                  <Chip size="sm" variant="success">
                    Listo
                  </Chip>
                ) : null}
              </div>
              <p className="mt-0.5 text-caption text-[var(--color-ink-muted)]">
                {step.description}
              </p>
            </div>
            {!step.done ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={step.href}>
                  {step.cta ?? "Configurar"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
