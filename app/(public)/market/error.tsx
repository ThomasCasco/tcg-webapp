"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function MarketError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("market.page.error", error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
      <Card padding="lg" className="w-full text-center">
        <p className="t-eyebrow text-[var(--color-danger)]">Algo salió mal</p>
        <h1 className="mt-2 text-h2 t-display">No pudimos cargar el mercado</h1>
        <p className="mt-2 t-sm t-mute">
          Reintentá en unos segundos. Si persiste, avisanos.
        </p>
        <div className="mt-5">
          <Button onClick={reset}>Reintentar</Button>
        </div>
      </Card>
    </section>
  );
}
