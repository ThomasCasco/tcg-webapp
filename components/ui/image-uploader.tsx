"use client";
/**
 * ImageUploader — file picker with preview that uploads to /api/upload/card-image.
 *
 * Stateful: holds the current image URL internally and notifies the parent via
 * `onChange(url | null)`. Parent can also seed an initial value via `value`.
 */

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

export type ImageUploaderProps = {
  value?: string | null;
  onChange?: (url: string | null) => void;
  /** Layout: "card" (vertical, big preview) or "compact" (horizontal). */
  variant?: "card" | "compact";
  /** Max upload size in MB. Default 5. */
  maxMb?: number;
  className?: string;
  /** Label to show on the empty button. */
  emptyLabel?: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ImageUploader({
  value,
  onChange,
  variant = "card",
  maxMb = 5,
  className,
  emptyLabel = "Subir foto",
}: ImageUploaderProps) {
  const [url, setUrl] = useState<string | null>(value ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function setAndNotify(next: string | null) {
    setUrl(next);
    onChange?.(next);
  }

  async function upload(file: File) {
    setError(null);

    if (file.size > maxMb * 1024 * 1024) {
      setError(`La imagen supera ${maxMb} MB.`);
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/upload/card-image", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "No se pudo subir la imagen.");
      }
      setAndNotify(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de subida.");
    } finally {
      setUploading(false);
    }
  }

  function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void upload(file);
    // Reset value so the same file can be picked again later
    event.target.value = "";
  }

  function clear() {
    setAndNotify(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Compact variant (small, horizontal — for inline editing)
  // ──────────────────────────────────────────────────────────────────────────
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Vista previa" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-[var(--color-ink-subtle)]">
              <ImagePlus className="h-5 w-5" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-black/40">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-input)] bg-[var(--color-accent-soft)] px-3 text-[0.8125rem] font-semibold text-[var(--color-accent-strong)] hover:bg-[var(--color-accent-soft)]/80 disabled:opacity-60"
          >
            <ImagePlus className="h-4 w-4" />
            {url ? "Cambiar foto" : emptyLabel}
          </button>
          {url && (
            <button
              type="button"
              onClick={clear}
              disabled={uploading}
              className="text-caption text-[var(--color-ink-muted)] hover:text-[var(--color-danger)]"
            >
              Quitar foto
            </button>
          )}
          {error && (
            <p role="alert" className="text-caption text-[var(--color-danger)]">
              {error}
            </p>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handlePick}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Card variant (large drop zone with preview)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-2", className)}>
      {url ? (
        <div className="relative aspect-[3/4] w-full max-w-[180px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Vista previa" className="h-full w-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={clear}
            disabled={uploading}
            aria-label="Quitar foto"
            className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-x-1.5 bottom-1.5 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white/90 text-[0.75rem] font-semibold text-[var(--color-ink)] backdrop-blur hover:bg-white disabled:opacity-60"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Cambiar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex aspect-[3/4] w-full max-w-[180px] flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] p-4 text-center transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/40 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
          ) : (
            <ImagePlus className="h-6 w-6 text-[var(--color-ink-muted)]" />
          )}
          <p className="text-[0.8125rem] font-semibold text-[var(--color-ink)]">
            {emptyLabel}
          </p>
          <p className="text-caption text-[var(--color-ink-muted)]">
            JPG, PNG o WebP · máx {maxMb} MB
          </p>
        </button>
      )}

      {error && (
        <p role="alert" className="text-caption text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handlePick}
      />
    </div>
  );
}
