import Link from "next/link";

export default function LoginPage() {
  return (
    <section className="surface-panel mx-auto w-full max-w-xl p-6 md:p-8">
      <p className="text-xs uppercase tracking-[0.15em] text-black/55">
        Acceso vendedor/comprador
      </p>
      <h1 className="mt-2 text-4xl [font-family:var(--font-display)]">Login</h1>
      <p className="mt-2 text-sm text-black/70">
        Pantalla inicial. La autenticacion real con Supabase se conecta en el
        siguiente sprint.
      </p>

      <form className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-black/70">Email</span>
          <input
            type="email"
            placeholder="tu@email.com"
            className="w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-4 py-2.5 outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-black/70">Password</span>
          <input
            type="password"
            placeholder="********"
            className="w-full rounded-xl border border-[var(--color-border)] bg-white/75 px-4 py-2.5 outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <button
          type="button"
          className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]"
        >
          Entrar (stub)
        </button>
      </form>

      <p className="mt-5 text-sm text-black/70">
        No tenes cuenta?{" "}
        <Link href="/register" className="font-semibold text-[var(--color-accent)]">
          Registrate
        </Link>
      </p>
    </section>
  );
}