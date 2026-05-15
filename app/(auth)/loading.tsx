export default function AuthLoading() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-12">
      <div className="h-2 w-32 animate-pulse rounded-full bg-[var(--glass-fill)]" />
      <div className="h-2 w-24 animate-pulse rounded-full bg-[var(--glass-fill)]" />
    </section>
  );
}
