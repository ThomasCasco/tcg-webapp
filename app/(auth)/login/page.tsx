import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { getAuthenticatedUser } from "@/lib/server/auth";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/inventory");
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-ink)] [font-family:var(--font-display)]">
          Bienvenido de vuelta
        </h1>
        <p className="mt-2 text-body text-[var(--color-ink-muted)]">
          Ingresa a tu cuenta para continuar
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-sm md:p-8">
        <LoginForm />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--color-ink-muted)]">
            No tenes cuenta?{" "}
            <Link 
              href="/register" 
              className="font-semibold text-[var(--color-ink)] hover:underline"
            >
              Registrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
