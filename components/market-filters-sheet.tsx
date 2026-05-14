"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Filter } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";
import type { CardCondition } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";

type Sort = "recent" | "price_asc" | "price_desc";

type Initial = {
  q: string;
  tab: string;
  condition: string;
  min: string;
  max: string;
  delivery: string;
  sort: Sort;
};

const CONDITIONS: CardCondition[] = [
  "mint",
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
];

const SORTS: Array<{ key: Sort; label: string }> = [
  { key: "recent", label: "Más recientes" },
  { key: "price_asc", label: "Menor precio" },
  { key: "price_desc", label: "Mayor precio" },
];

const DELIVERY: Array<{ key: string; label: string }> = [
  { key: "", label: "Cualquiera" },
  { key: "shipping", label: "Con envío" },
  { key: "pickup", label: "Con retiro" },
];

type Props = {
  initial: Initial;
  activeCount: number;
};

export function MarketFiltersSheet({ initial, activeCount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Local state mirrors the URL params; we apply on submit.
  const [condition, setCondition] = useState(initial.condition);
  const [delivery, setDelivery] = useState(initial.delivery);
  const [min, setMin] = useState(initial.min);
  const [max, setMax] = useState(initial.max);
  const [sort, setSort] = useState<Sort>(initial.sort);

  function apply() {
    const params = new URLSearchParams();
    if (initial.q) params.set("q", initial.q);
    if (initial.tab && initial.tab !== "all") params.set("tab", initial.tab);
    if (condition) params.set("condition", condition);
    if (delivery) params.set("delivery", delivery);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (sort && sort !== "recent") params.set("sort", sort);
    const qs = params.toString();
    router.push(qs ? `/market?${qs}` : "/market");
    setOpen(false);
  }

  function reset() {
    setCondition("");
    setDelivery("");
    setMin("");
    setMax("");
    setSort("recent");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title="Filtros"
      description="Ajustá los resultados a lo que buscás."
      side="bottom"
      trigger={
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="relative shrink-0"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 ? (
            <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="md" onClick={reset}>
            Limpiar
          </Button>
          <Button type="button" size="md" onClick={apply}>
            Aplicar
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormField label="Condición" htmlFor="ff-condition">
          <div id="ff-condition" className="flex flex-wrap gap-1.5">
            <Pill active={!condition} onClick={() => setCondition("")} label="Todas" />
            {CONDITIONS.map((c) => (
              <Pill
                key={c}
                active={condition === c}
                onClick={() => setCondition(c)}
                label={formatConditionEs(c)}
              />
            ))}
          </div>
        </FormField>

        <FormField label="Entrega" htmlFor="ff-delivery">
          <div id="ff-delivery" className="flex flex-wrap gap-1.5">
            {DELIVERY.map((d) => (
              <Pill
                key={d.key || "any"}
                active={delivery === d.key}
                onClick={() => setDelivery(d.key)}
                label={d.label}
              />
            ))}
          </div>
        </FormField>

        <FormField label="Precio (ARS)" htmlFor="ff-min" hint="Dejá vacío para no filtrar.">
          <div className="grid grid-cols-2 gap-2">
            <Input
              id="ff-min"
              type="number"
              inputMode="numeric"
              min={1}
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder="Mínimo"
            />
            <Input
              id="ff-max"
              type="number"
              inputMode="numeric"
              min={1}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="Máximo"
            />
          </div>
        </FormField>

        <FormField label="Ordenar por" htmlFor="ff-sort">
          <div id="ff-sort" className="flex flex-wrap gap-1.5">
            {SORTS.map((s) => (
              <Pill
                key={s.key}
                active={sort === s.key}
                onClick={() => setSort(s.key)}
                label={s.label}
              />
            ))}
          </div>
        </FormField>
      </div>
    </Sheet>
  );
}

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 t-xs font-semibold transition-colors",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--glass-border)] bg-[var(--glass-fill)] text-[var(--ink)] hover:border-[var(--accent-hi)]"
      )}
    >
      {label}
    </button>
  );
}
