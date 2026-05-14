"use client";

import { FormEvent, useState } from "react";
import type { SocialProfile } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle } from "@/components/ui/icon";

const BIO_MAX = 360;

type Props = {
  initialProfile: SocialProfile;
};

export function SocialProfileForm({ initialProfile }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl ?? "");
  const [score, setScore] = useState(initialProfile.completionScore);
  const [bio, setBio] = useState(initialProfile.bio ?? "");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      displayName: String(form.get("displayName") ?? "").trim(),
      bio: String(form.get("bio") ?? "").trim(),
      location: String(form.get("location") ?? "").trim(),
      avatarUrl: String(form.get("avatarUrl") ?? "").trim(),
      favoriteGame: String(form.get("favoriteGame") ?? "").trim(),
      favoriteCard: String(form.get("favoriteCard") ?? "").trim(),
      instagram: String(form.get("instagram") ?? "").trim(),
      discord: String(form.get("discord") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/profile/social", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { profile?: SocialProfile; error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el perfil.");
      setScore(data.profile?.completionScore ?? score);
      setSuccess("Perfil social guardado.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  const bioLeft = Math.max(0, BIO_MAX - bio.length);

  return (
    <Card padding="lg">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={initialProfile.username} src={avatarUrl || null} size="lg" />
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Perfil público</p>
            <h2 className="text-h2 [font-family:var(--font-display)]">@{initialProfile.username}</h2>
            <p className="text-caption text-[var(--color-ink-muted)]">
              Otros usuarios te ven con esta info.
            </p>
          </div>
        </div>
        <div className="min-w-[10rem] rounded-[var(--radius-card)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]/60 p-3">
          <div className="flex items-center justify-between">
            <p className="text-overline text-[var(--color-accent-strong)]">Completitud</p>
            <p className="text-h3 font-bold text-[var(--color-accent-strong)]">{score}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-[width]"
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        </div>
      </header>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <section className="space-y-3">
          <h3 className="text-body-sm font-bold text-[var(--color-ink)]">Identidad</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Nombre visible" htmlFor="displayName">
              <Input
                id="displayName"
                name="displayName"
                defaultValue={initialProfile.displayName ?? ""}
                maxLength={60}
                placeholder="Tomi Cards"
              />
            </FormField>

            <FormField label="Ubicación" htmlFor="location">
              <Input
                id="location"
                name="location"
                defaultValue={initialProfile.location ?? ""}
                maxLength={80}
                placeholder="CABA, Argentina"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Avatar URL" htmlFor="avatarUrl" hint="Pegá un enlace a una imagen pública.">
                <Input
                  id="avatarUrl"
                  name="avatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://..."
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="Bio" htmlFor="bio">
                <div className="space-y-1">
                  <Textarea
                    id="bio"
                    name="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={BIO_MAX}
                    rows={4}
                    placeholder="Colecciono Pokemon vintage, hago trades en persona y busco completar sets de Scarlet & Violet."
                  />
                  <div className="flex justify-end">
                    <span className="text-caption text-[var(--color-ink-subtle)]">
                      {bioLeft} caracteres restantes
                    </span>
                  </div>
                </div>
              </FormField>
            </div>
          </div>
        </section>

        <div className="h-px bg-[var(--color-border-subtle)]" />

        <section className="space-y-3">
          <h3 className="text-body-sm font-bold text-[var(--color-ink)]">Gustos</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="TCG favorito" htmlFor="favoriteGame">
              <Input
                id="favoriteGame"
                name="favoriteGame"
                defaultValue={initialProfile.favoriteGame ?? ""}
                maxLength={60}
                placeholder="Pokemon"
              />
            </FormField>

            <FormField label="Carta favorita" htmlFor="favoriteCard">
              <Input
                id="favoriteCard"
                name="favoriteCard"
                defaultValue={initialProfile.favoriteCard ?? ""}
                maxLength={120}
                placeholder="Gengar VMAX"
              />
            </FormField>
          </div>
        </section>

        <div className="h-px bg-[var(--color-border-subtle)]" />

        <section className="space-y-3">
          <h3 className="text-body-sm font-bold text-[var(--color-ink)]">Redes</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Instagram" htmlFor="instagram">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-body-sm font-semibold text-[var(--color-ink-subtle)]">
                  @
                </span>
                <Input
                  id="instagram"
                  name="instagram"
                  defaultValue={initialProfile.instagram ?? ""}
                  maxLength={80}
                  placeholder="usuario"
                  className="pl-7"
                />
              </div>
            </FormField>

            <FormField label="Discord" htmlFor="discord">
              <Input
                id="discord"
                name="discord"
                defaultValue={initialProfile.discord ?? ""}
                maxLength={80}
                placeholder="usuario#1234"
              />
            </FormField>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            {error && (
              <p role="alert" className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-danger)]">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-success)]">
                <CheckCircle className="h-4 w-4" />
                {success}
              </p>
            )}
            {!error && !success && (
              <p className="text-caption text-[var(--color-ink-subtle)]">
                Cuanto más completo, mejor te encuentran.
              </p>
            )}
          </div>
          <Button type="submit" loading={loading} size="md">
            Guardar perfil social
          </Button>
        </div>
      </form>
    </Card>
  );
}
