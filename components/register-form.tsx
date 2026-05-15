"use client";
import { FormEvent, InvalidEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowRight, CheckCircle, Eye, EyeOff } from "@/components/ui/icon";

const MIN_PASSWORD = 8;

function passwordStrength(value: string): { label: string; level: 0 | 1 | 2 | 3 } {
  let score = 0;
  if (value.length >= MIN_PASSWORD) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score++;
  const labels = ["Muy débil", "Débil", "Aceptable", "Sólida"] as const;
  return { label: labels[score], level: score as 0 | 1 | 2 | 3 };
}

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      username: String(form.get("username") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
        requiresEmailConfirmation?: boolean;
      };
      if (!response.ok) throw new Error(data.error ?? "No se pudo crear la cuenta.");
      if (data.requiresEmailConfirmation) {
        setSuccess("Cuenta creada. Revisá tu email para confirmar.");
      } else {
        router.push("/inventory");
        router.refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  function onInvalid(event: InvalidEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    if (input.validity.valueMissing) {
      if (input.name === "username") input.setCustomValidity("Ingresá tu nombre público.");
      else if (input.name === "email") input.setCustomValidity("Ingresá tu email.");
      else if (input.name === "password") input.setCustomValidity("Ingresá una contraseña.");
      else if (input.name === "terms") input.setCustomValidity("Tenés que aceptar los términos para continuar.");
      else input.setCustomValidity("Completá este campo.");
    } else if (input.validity.typeMismatch) {
      input.setCustomValidity("Ingresá un email válido.");
    } else if (input.validity.tooShort) {
      const label = input.name === "username" ? "El nombre público" : "La contraseña";
      input.setCustomValidity(`${label} debe tener al menos ${input.minLength} caracteres.`);
    } else {
      input.setCustomValidity("Revisá este campo.");
    }
  }

  function clearValidity(event: FormEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity("");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField
        label="Nombre público"
        htmlFor="username"
        required
        hint="Lo verán otros vendedores y compradores."
      >
        <Input
          id="username"
          name="username"
          required
          minLength={3}
          maxLength={24}
          onInvalid={onInvalid}
          onInput={clearValidity}
          placeholder="BinderBoss"
        />
      </FormField>
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
      <FormField label="Contraseña" htmlFor="password" required hint="Mínimo 8 caracteres.">
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            onInvalid={onInvalid}
            onInput={(event) => {
              clearValidity(event);
              setPassword(event.currentTarget.value);
            }}
            placeholder="••••••••"
            value={password}
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
        {password.length > 0 && (() => {
          const strength = passwordStrength(password);
          const colors = ["bg-[var(--bad)]", "bg-[var(--bad)]", "bg-[var(--accent)]", "bg-[var(--ok)]"] as const;
          return (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={"h-1.5 flex-1 rounded-full " + (i < strength.level + 1 ? colors[strength.level] : "bg-white/10")}
                  />
                ))}
              </div>
              <span className="w-20 text-right t-xs font-semibold t-mute">{strength.label}</span>
            </div>
          );
        })()}
      </FormField>
      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-white/[0.02] p-3 t-sm t-mute transition-colors hover:border-[var(--glass-border-hi)]">
        <input
          type="checkbox"
          required
          name="terms"
          onInvalid={onInvalid}
          onInput={clearValidity}
          className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
        />
        <span>
          Soy mayor de 18 años y acepto los{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--accent-hi)] underline"
          >
            Términos y Condiciones
          </Link>
          {" "}y la{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--accent-hi)] underline"
          >
            Política de Privacidad
          </Link>
          . Entiendo que la plataforma es un clasificado y NO custodia fondos.
        </span>
      </label>
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-[var(--r-sm)] border border-[var(--bad)]/30 bg-[var(--color-danger-soft)] px-3 py-2 t-sm text-[var(--bad)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div role="status" className="flex items-start gap-2 rounded-[var(--r-sm)] border border-[var(--ok)]/30 bg-[var(--color-success-soft)] px-3 py-2 t-sm text-[var(--ok)]">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      <Button
        type="submit"
        loading={loading}
        fullWidth
        size="lg"
        rightIcon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
      >
        Crear cuenta
      </Button>
      <p className="text-center t-sm t-mute">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent-hi)] hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
