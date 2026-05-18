"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "@/components/ui/icon";

const MIN_PASSWORD = 8;

type SessionState = "checking" | "ready" | "invalid" | "updated";

function makeSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function ResetPasswordForm() {
  const supabase = useMemo(() => makeSupabaseClient(), []);
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function establishRecoverySession() {
      if (!supabase) {
        setSessionState("invalid");
        setMessage("Supabase no está configurado para recuperar contraseñas.");
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const searchParams = new URLSearchParams(window.location.search);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const code = searchParams.get("code") ?? hashParams.get("code");

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          throw new Error("El link de recuperación está incompleto o vencido.");
        }

        if (!cancelled) {
          window.history.replaceState(null, "", "/reset-password");
          setSessionState("ready");
          setMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setSessionState("invalid");
          setMessage(
            error instanceof Error
              ? error.message
              : "No pudimos validar el link de recuperación.",
          );
        }
      }
    }

    void establishRecoverySession();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    if (password.length < MIN_PASSWORD) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut().catch(() => {});
      setSessionState("updated");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No pudimos cambiar la contraseña.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (sessionState === "checking") {
    return <p className="t-sm t-mute">Validando link de recuperación...</p>;
  }

  if (sessionState === "invalid") {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[var(--r-sm)] border border-[var(--bad)]/30 bg-[var(--color-danger-soft)] px-3 py-2 t-sm text-[var(--bad)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message ?? "El link no es válido."}</span>
        </div>
        <Button asChild fullWidth>
          <Link href="/forgot-password">Pedir otro link</Link>
        </Button>
      </div>
    );
  }

  if (sessionState === "updated") {
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="flex items-start gap-2 rounded-[var(--r-sm)] border border-[var(--ok)]/30 bg-[var(--color-success-soft)] px-3 py-2 t-sm text-[var(--ok)]"
        >
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Contraseña actualizada. Ya podés entrar con la nueva.</span>
        </div>
        <Button asChild fullWidth>
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField label="Nueva contraseña" htmlFor="password" required hint="Mínimo 8 caracteres.">
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[var(--r-sm)] t-mute transition-colors hover:bg-white/5 hover:text-[var(--ink)]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </FormField>
      <FormField label="Repetir contraseña" htmlFor="confirm-password" required>
        <Input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.currentTarget.value)}
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
        />
      </FormField>
      {message && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[var(--r-sm)] border border-[var(--bad)]/30 bg-[var(--color-danger-soft)] px-3 py-2 t-sm text-[var(--bad)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      <Button
        type="submit"
        loading={loading}
        disabled={password.length < MIN_PASSWORD || password !== confirmPassword}
        fullWidth
        size="lg"
      >
        Cambiar contraseña
      </Button>
    </form>
  );
}
