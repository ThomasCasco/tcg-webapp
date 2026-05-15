import { Card } from "@/components/ui/card";

export default function TransactionsLoading() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-3 py-4 md:px-6 md:py-7">
      <div className="h-10 w-full animate-pulse rounded-[var(--r-md)] bg-[var(--glass-fill)]" />
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} padding="md" className="animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded bg-[var(--glass-fill)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-[var(--glass-fill)]" />
                <div className="h-3 w-1/3 rounded bg-[var(--glass-fill)]" />
              </div>
              <div className="h-6 w-20 rounded bg-[var(--glass-fill)]" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
