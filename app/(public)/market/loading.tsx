import { Card } from "@/components/ui/card";

export default function MarketLoading() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4 md:px-6 md:py-7">
      <div className="h-10 w-full animate-pulse rounded-[var(--r-md)] bg-[var(--glass-fill)]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} padding="sm" className="animate-pulse">
            <div className="aspect-[3/4] w-full rounded-[var(--r-sm)] bg-[var(--glass-fill)]" />
            <div className="mt-3 h-4 w-3/4 rounded bg-[var(--glass-fill)]" />
            <div className="mt-2 h-3 w-1/2 rounded bg-[var(--glass-fill)]" />
          </Card>
        ))}
      </div>
    </section>
  );
}
