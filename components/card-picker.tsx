"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type PickedCard = {
  id: string;
  name: string;
  setName: string;
  setId: string;
  number: string;
  rarity: string | null;
  imageSmall: string | null;
  marketPriceUsd: number | null;
  marketPriceEur: number | null;
};

type SetOption = {
  id: string;
  name: string;
  logo: string | null;
  cardCount: number;
};

type CardPickerProps = {
  onPick: (card: PickedCard | null) => void;
  initial?: PickedCard | null;
  placeholder?: string;
};

let SETS_PROMISE: Promise<SetOption[]> | null = null;

function loadSets(): Promise<SetOption[]> {
  if (!SETS_PROMISE) {
    SETS_PROMISE = fetch("/api/catalog/sets")
      .then((r) => r.json())
      .then((data: { items?: SetOption[] }) => data.items ?? [])
      .catch(() => []);
  }
  return SETS_PROMISE;
}

export function CardPicker({
  onPick,
  initial = null,
  placeholder = "Buscá: Pikachu, Charizard...",
}: CardPickerProps) {
  const [query, setQuery] = useState(initial?.name ?? "");
  const [results, setResults] = useState<PickedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PickedCard | null>(initial);

  const [sets, setSets] = useState<SetOption[]>([]);
  const [setsFilter, setSetsFilter] = useState("");
  const [selectedSet, setSelectedSet] = useState<SetOption | null>(null);
  const [setsOpen, setSetsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const setsRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSets().then((data) => {
      if (!cancelled) setSets(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSets = useMemo(() => {
    const q = setsFilter.trim().toLowerCase();
    const base = q.length === 0 ? sets : sets.filter((s) => s.name.toLowerCase().includes(q));
    return base.slice(0, 40);
  }, [sets, setsFilter]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const isEmpty = !query || query.trim().length < 2 || picked?.name === query;

    debounceRef.current = window.setTimeout(async () => {
      if (isEmpty) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query.trim() });
        if (selectedSet) params.set("set", selectedSet.name);
        const response = await fetch(`/api/catalog/search?${params.toString()}`);
        const data = (await response.json()) as { items?: PickedCard[] };
        setResults(data.items ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, isEmpty ? 0 : 220);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, picked, selectedSet]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
      if (setsRef.current && !setsRef.current.contains(target)) {
        setSetsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function choose(card: PickedCard) {
    setPicked(card);
    setQuery(card.name);
    setOpen(false);
    onPick(card);
  }

  function clearPick() {
    setPicked(null);
    setQuery("");
    setResults([]);
    onPick(null);
  }

  function pickSet(option: SetOption | null) {
    setSelectedSet(option);
    setSetsFilter(option?.name ?? "");
    setSetsOpen(false);
  }

  return (
    <div className="space-y-3">
      <div ref={setsRef} className="relative">
        <label className="mb-1 block text-xs font-medium subtle">
          Set / Expansión (opcional)
        </label>
        <div className="input flex items-center gap-2 px-3 py-2 focus-within:border-[var(--color-accent)]">
          {selectedSet?.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={selectedSet.logo}
              alt={selectedSet.name}
              className="h-6 w-auto max-w-[80px] object-contain"
            />
          ) : null}
          <input
            type="text"
            value={setsFilter}
            placeholder="Todos los sets"
            autoComplete="off"
            onChange={(event) => {
              setSetsFilter(event.target.value);
              if (selectedSet) setSelectedSet(null);
              setSetsOpen(true);
            }}
            onFocus={() => setSetsOpen(true)}
            className="flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
          />
          {selectedSet || setsFilter ? (
            <button
              type="button"
              onClick={() => pickSet(null)}
              className="rounded-full px-2 py-0.5 text-xs subtle hover:bg-white/5"
              aria-label="Limpiar set"
            >
              ×
            </button>
          ) : null}
        </div>

        {setsOpen ? (
          <div className="glass absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-[var(--r-md)]">
            <button
              type="button"
              onClick={() => pickSet(null)}
              className="flex w-full items-center gap-2 border-b border-[var(--color-border)] px-3 py-2 text-left text-sm hover:bg-white/5"
            >
              <span className="muted">Todos los sets</span>
            </button>
            {filteredSets.length === 0 ? (
              <div className="px-3 py-2 text-sm muted">Sin sets que coincidan.</div>
            ) : (
              filteredSets.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => pickSet(option)}
                  className="flex w-full items-center gap-3 border-b border-[var(--color-border)] px-3 py-2 text-left text-sm last:border-b-0 hover:bg-white/5"
                >
                  {option.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={option.logo}
                      alt={option.name}
                      className="h-6 w-auto max-w-[72px] object-contain"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded bg-[var(--glass-fill)]" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{option.name}</p>
                    <p className="text-xs subtle">
                      {option.cardCount} cartas · {option.id}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div ref={containerRef} className="relative">
        <label className="mb-1 block text-xs font-medium subtle">Carta</label>
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            if (picked) {
              setPicked(null);
              onPick(null);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          className="input"
        />

        {picked ? (
          <div className="glass-soft mt-2 flex items-center gap-3 rounded-[var(--r-md)] p-2 text-sm">
            {picked.imageSmall ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={picked.imageSmall}
                alt={picked.name}
                className="h-16 w-12 rounded object-cover"
              />
            ) : (
              <div className="h-16 w-12 rounded bg-[var(--glass-fill)]" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{picked.name}</p>
              <p className="text-xs muted">
                {picked.setName || picked.setId} · #{picked.number}
                {picked.rarity ? ` · ${picked.rarity}` : ""}
              </p>
              {picked.marketPriceEur ? (
                <p className="text-xs muted">
                  Ref: EUR {picked.marketPriceEur.toFixed(2)}
                </p>
              ) : null}
            </div>
            <button type="button" onClick={clearPick} className="btn btn-ghost btn-sm">
              Cambiar
            </button>
          </div>
        ) : null}

        {open && !picked ? (
          <div className="glass absolute z-20 mt-1 max-h-96 w-full overflow-auto rounded-[var(--r-md)]">
            {loading ? (
              <div className="px-3 py-2 text-sm muted">Buscando...</div>
            ) : results.length === 0 ? (
              <div className="px-3 py-2 text-sm muted">
                Sin resultados.{" "}
                {selectedSet ? "Probá sacar el filtro de set." : "Probá con otro nombre."}
              </div>
            ) : (
              results.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => choose(card)}
                  className="flex w-full items-center gap-3 border-b border-[var(--color-border)] px-3 py-2 text-left text-sm last:border-b-0 hover:bg-white/5"
                >
                  {card.imageSmall ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={card.imageSmall}
                      alt={card.name}
                      className="h-16 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="h-16 w-12 rounded bg-[var(--glass-fill)]" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{card.name}</p>
                    <p className="text-xs muted">
                      {card.setName || card.setId} · #{card.number}
                      {card.rarity ? ` · ${card.rarity}` : ""}
                    </p>
                  </div>
                  {card.marketPriceEur ? (
                    <span className="chip chip-accent">
                      EUR {card.marketPriceEur.toFixed(2)}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
