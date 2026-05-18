"use client";
import { FormEvent, InvalidEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowRight, Eye, EyeOff } from "@/components/ui/icon";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar sesión.");
      router.push("/inventory");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  function onInvalid(event: InvalidEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    if (input.validity.valueMissing) {
      input.setCustomValidity(
        input.name === "email" ? "Ingresá tu email." : "Ingresá tu contraseña.",
      );
    } else if (input.validity.typeMismatch) {
      input.setCustomValidity("Ingresá un email válido.");
    } else if (input.validity.tooShort) {
      input.setCustomValidity("La contraseña debe tener al menos 8 caracteres.");
    } else {
      input.setCustomValidity("Revisá este campo.");
    }
  }

  function clearValidity(event: FormEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity("");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField label="Email" htmlFor="email" required>
        <Input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          required
          onInvalid={onInvalid}
          onInput={clearValidity}
          placeholder="tu@email.com"
        />
      </FormField>
      <FormField label="Contraseña" htmlFor="password" required>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            minLength={8}
            onInvalid={onInvalid}
            onInput={clearValidity}
            placeholder="••••••••"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[var(--r-sm)] t-mute transition-colors hover:bg-white/5 hover:text-[var(--ink)]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </FormField>
      <div className="-mt-2 text-right">
        <Link
          href="/forgot-password"
          className="t-sm font-semibold text-[var(--accent-hi)] hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[var(--r-sm)] border border-[var(--bad)]/30 bg-[var(--color-danger-soft)] px-3 py-2 t-sm text-[var(--bad)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button
        type="submit"
        loading={loading}
        fullWidth
        size="lg"
        rightIcon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
      >
        Entrar
      </Button>
      <p className="text-center t-sm t-mute">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-semibold text-[var(--accent-hi)] hover:underline">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
