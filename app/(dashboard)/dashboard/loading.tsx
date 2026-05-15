import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-3 py-4 md:px-6 md:py-7">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="md" className="animate-pulse">
            <div className="h-3 w-2/3 rounded bg-[var(--glass-fill)]" />
            <div className="mt-3 h-8 w-1/2 rounded bg-[var(--glass-fill)]" />
          </Card>
        ))}
      </div>
      <Card padding="lg" className="animate-pulse">
        <div className="h-4 w-1/3 rounded bg-[var(--glass-fill)]" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded bg-[var(--glass-fill)]" />
          ))}
        </div>
      </Card>
    </section>
  );
}
