"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("dashboard.page.error", error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
      <Card padding="lg" className="w-full text-center">
        <p className="t-eyebrow text-[var(--color-danger)]">Algo salió mal</p>
        <h1 className="mt-2 text-h2 t-display">No pudimos cargar tu panel</h1>
        <p className="mt-2 t-sm t-mute">
          Reintentá. Si persiste, refrescá la sesión.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={reset}>Reintentar</Button>
        </div>
      </Card>
    </section>
  );
}
