"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MpConnectButton } from "@/components/mp-connect-button";
import { ArrowRight, CheckCircle, ShoppingBag, Tag } from "@/components/ui/icon";

type Step = 1 | 2 | 3;

type Props = {
  initialStep: Step;
  mpConnected: boolean;
  mpError?: string;
};

export function OnboardingWizard({ initialStep, mpConnected, mpError }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  async function saveProfile() {
    const res = await fetch("/api/profile/social", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Error al guardar el perfil.");
    }
  }

  async function handleStep1() {
    if (!displayName.trim()) {
      setError("Ingresá tu nombre visible.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await saveProfile();
      setStep(mpConnected ? 3 : 2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish(destination: string) {
    setLoading(true);
    await fetch("/api/profile/onboarding", { method: "POST" }).catch(() => {});
    router.push(destination);
  }

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <section className="mx-auto max-w-lg space-y-5 py-6">
      <div>
        <div className="mb-1 flex items-center justify-between text-caption text-[var(--color-ink-muted)]">
          <span>Paso {step} de 3</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-border-default)]">
          <div
            className="h-1.5 rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <Card padding="lg" className="space-y-4">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Paso 1 de 3</p>
            <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">¡Bienvenido/a!</h1>
            <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
              Contanos cómo te vas a llamar en la comunidad. Aparece en tus publicaciones.
            </p>
          </div>

          <FormField label="Nombre visible" htmlFor="onb-name" required hint="Como querés que te vean los demás">
            <Input
              id="onb-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej: Nico TCG"
              autoFocus
            />
          </FormField>

          <FormField label="Bio (opcional)" htmlFor="onb-bio" hint="Qué coleccionás o qué jugás">
            <Textarea
              id="onb-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fan de Pokémon desde Base Set. Busco holográficas…"
              rows={2}
            />
          </FormField>

          <FormField label="Ubicación (opcional)" htmlFor="onb-location" hint="Ciudad o zona: ayuda a coordinar retiros">
            <Input
              id="onb-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Caballito, CABA"
            />
          </FormField>

          {error && <p role="alert" className="text-body-sm text-[var(--color-danger)]">{error}</p>}

          <Button onClick={handleStep1} disabled={loading} loading={loading} className="w-full">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card padding="lg" className="space-y-4">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Paso 2 de 3</p>
            <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">Conectá Mercado Pago</h1>
            <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
              Para vender necesitás conectar tu cuenta: los compradores te pagan directo ahí y la
              venta se confirma sola. Si solo querés comprar, podés saltear este paso.
            </p>
          </div>

          <MpConnectButton
            status={mpError ? "error" : "disconnected"}
            feedback={mpError}
            connectUrl="/api/auth/mercadopago?return_to=/onboarding"
          />

          <Button variant="ghost" onClick={() => setStep(3)} disabled={loading} className="w-full">
            Solo quiero comprar, lo hago después
          </Button>
        </Card>
      )}

      {step === 3 && (
        <Card padding="lg" className="space-y-5 text-center">
          <div>
            <CheckCircle className="mx-auto h-12 w-12 text-[var(--color-success)]" />
            <h1 className="mt-3 text-h1 [font-family:var(--font-display)]">¡Todo listo!</h1>
            <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
              {mpConnected
                ? "Mercado Pago quedó conectado. Ya podés publicar tu primera carta."
                : "Ya podés comprar. Cuando quieras vender, conectá Mercado Pago desde tu cuenta."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={() => handleFinish(mpConnected ? "/inventory" : "/market")}
              disabled={loading}
              loading={loading}
              size="lg"
            >
              {mpConnected ? <Tag className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              {mpConnected ? "Publicar mi primera carta" : "Ver el mercado"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleFinish(mpConnected ? "/market" : "/account")}
              disabled={loading}
              size="lg"
            >
              {mpConnected ? "Ver el mercado" : "Conectar Mercado Pago"}
            </Button>
          </div>
        </Card>
      )}
    </section>
  );
}
