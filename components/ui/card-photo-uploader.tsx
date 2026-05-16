"use client";

import { useRef, useState, useCallback } from "react";
import { ImagePlus, X, Loader2, RotateCcw } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

export type CardPhotoUploaderProps = {
  frontUrl?: string | null;
  backUrl?: string | null;
  onFrontChange?: (url: string | null) => void;
  onBackChange?: (url: string | null) => void;
  maxMb?: number;
  className?: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type Side = "front" | "back";

export function CardPhotoUploader({
  frontUrl,
  backUrl,
  onFrontChange,
  onBackChange,
  maxMb = 5,
  className,
}: CardPhotoUploaderProps) {
  const [urls, setUrls] = useState<Record<Side, string | null>>({
    front: frontUrl ?? null,
    back: backUrl ?? null,
  });
  const [uploading, setUploading] = useState<Record<Side, boolean>>({
    front: false,
    back: false,
  });
  const [errors, setErrors] = useState<Record<Side, string | null>>({
    front: null,
    back: null,
  });
  const [dragOver, setDragOver] = useState<Record<Side, boolean>>({
    front: false,
    back: false,
  });

  const [flipped, setFlipped] = useState(false);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  function setUrl(side: Side, url: string | null) {
    setUrls((prev: Record<Side, string | null>) => ({ ...prev, [side]: url }));
    if (side === "front") onFrontChange?.(url);
    else onBackChange?.(url);
  }

  function setError(side: Side, msg: string | null) {
    setErrors((prev: Record<Side, string | null>) => ({ ...prev, [side]: msg }));
  }

  async function upload(side: Side, file: File) {
    setError(side, null);
    if (file.size > maxMb * 1024 * 1024) {
      setError(side, `La imagen supera ${maxMb} MB.`);
      return;
    }
    setUploading((prev: Record<Side, boolean>) => ({ ...prev, [side]: true }));
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/upload/card-image", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "No se pudo subir.");
      setUrl(side, data.url);
    } catch (err) {
      setError(side, err instanceof Error ? err.message : "Error de subida.");
    } finally {
      setUploading((prev: Record<Side, boolean>) => ({ ...prev, [side]: false }));
    }
  }

  function handlePick(side: Side, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void upload(side, file);
    e.target.value = "";
  }

  const handleDrop = useCallback(
    (side: Side, e: React.DragEvent) => {
      e.preventDefault();
      setDragOver((prev) => ({ ...prev, [side]: false }));
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) void upload(side, file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxMb],
  );

  function handleDragOver(side: Side, e: React.DragEvent) {
    e.preventDefault();
    setDragOver((prev) => ({ ...prev, [side]: true }));
  }

  function handleDragLeave(side: Side) {
    setDragOver((prev) => ({ ...prev, [side]: false }));
  }

  const frontVisible = !flipped;
  const currentSide: Side = flipped ? "back" : "front";
  const currentUrl = urls[currentSide];
  const currentUploading = uploading[currentSide];
  const currentError = errors[currentSide];
  const currentDragOver = dragOver[currentSide];
  const currentRef = flipped ? backRef : frontRef;

  const label = flipped ? "Reverso" : "Frente";
  const otherLabel = flipped ? "Frente" : "Reverso";
  const otherUrl = urls[flipped ? "front" : "back"];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Side toggle */}
      <div className="flex items-center gap-2">
        <div className="flex overflow-hidden rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] p-0.5">
          <button
            type="button"
            onClick={() => setFlipped(false)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.75rem] font-semibold transition-colors",
              !flipped
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--ink-mute)] hover:text-[var(--ink)]",
            )}
          >
            Frente
            {urls.front && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ok)]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.75rem] font-semibold transition-colors",
              flipped
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--ink-mute)] hover:text-[var(--ink)]",
            )}
          >
            Reverso
            {urls.back && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ok)]" />
            )}
          </button>
        </div>

        {(urls.front || urls.back) && (
          <span className="t-xs t-soft">
            {[urls.front && "frente", urls.back && "reverso"].filter(Boolean).join(" + ")} subido
            {(urls.front && urls.back) ? "s" : ""}
          </span>
        )}
      </div>

      {/* Upload zone */}
      <div className="flex gap-3">
        {/* Main (active side) */}
        <div className="space-y-1.5">
          {currentUrl ? (
            <div className="group relative aspect-[3/4] w-[140px] overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--bg-2)] shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUrl}
                alt={label}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {currentUploading && (
                <div className="absolute inset-0 grid place-items-center bg-black/50 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-full bg-black/70 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-white">
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => setUrl(currentSide, null)}
                  disabled={currentUploading}
                  aria-label={`Quitar ${label}`}
                  className="grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600 disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => currentRef.current?.click()}
                disabled={currentUploading}
                className="absolute inset-x-1.5 bottom-1.5 inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-[var(--accent)]/90 backdrop-blur-sm hover:bg-[var(--accent-hi)] text-[0.7rem] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-60"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Cambiar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => currentRef.current?.click()}
              disabled={currentUploading}
              onDrop={(e) => handleDrop(currentSide, e)}
              onDragOver={(e) => handleDragOver(currentSide, e)}
              onDragLeave={() => handleDragLeave(currentSide)}
              className={cn(
                "flex aspect-[3/4] w-[140px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-all",
                currentDragOver
                  ? "border-[var(--accent)] bg-[rgba(var(--accent-glow),0.2)] scale-[1.02]"
                  : "border-[var(--glass-border)] bg-[var(--glass-fill)] hover:border-[var(--accent-hi)] hover:bg-[rgba(var(--accent-glow),0.1)]",
                "disabled:opacity-60",
              )}
            >
              {currentUploading ? (
                <Loader2 className="h-7 w-7 animate-spin text-[var(--accent)]" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--glass-fill-hi)]">
                  <ImagePlus className="h-5 w-5 text-[var(--ink-mute)]" />
                </div>
              )}
              <div>
                <p className="text-[0.8125rem] font-semibold text-[var(--ink)]">
                  {currentDragOver ? "Soltar aquí" : label}
                </p>
                <p className="mt-0.5 text-[0.6875rem] text-[var(--ink-soft)]">
                  {currentDragOver ? "Suelta la imagen" : "Arrastrá o hacé clic"}
                </p>
              </div>
              <p className="text-[0.625rem] text-[var(--ink-soft)]">
                JPG · PNG · WebP
              </p>
            </button>
          )}

          {currentError && (
            <p role="alert" className="text-[0.6875rem] text-[var(--bad)]">
              {currentError}
            </p>
          )}
        </div>

        {/* Thumbnail of the other side */}
        <div className="flex flex-col gap-1.5 pt-1">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            {otherLabel}
          </p>
          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className={cn(
              "relative aspect-[3/4] w-[64px] overflow-hidden rounded-lg border transition-all hover:scale-105",
              otherUrl
                ? "border-[var(--glass-border)] bg-[var(--bg-2)] shadow"
                : "border-dashed border-[var(--glass-border)] bg-[var(--glass-fill)]",
            )}
            title={`Ver ${otherLabel}`}
          >
            {otherUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={otherUrl} alt={otherLabel} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <ImagePlus className="h-4 w-4 text-[var(--ink-soft)]" />
              </div>
            )}
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent pb-1">
              <RotateCcw className="h-3 w-3 text-white/80" />
            </div>
          </button>
          <p className="text-center text-[0.5625rem] text-[var(--ink-soft)]">
            {otherUrl ? "Ver" : "Agregar"}
          </p>
        </div>
      </div>

      <input
        ref={frontRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handlePick("front", e)}
      />
      <input
        ref={backRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handlePick("back", e)}
      />
    </div>
  );
}

/* Compact variant: shows both photos side by side in small thumbnails */
export function CardPhotoUploaderCompact({
  frontUrl,
  backUrl,
  onFrontChange,
  onBackChange,
  maxMb = 5,
  className,
}: CardPhotoUploaderProps) {
  const [urls, setUrls] = useState<Record<Side, string | null>>({
    front: frontUrl ?? null,
    back: backUrl ?? null,
  });
  const [uploading, setUploading] = useState<Record<Side, boolean>>({
    front: false,
    back: false,
  });
  const [errors, setErrors] = useState<Record<Side, string | null>>({
    front: null,
    back: null,
  });

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  function setUrl(side: Side, url: string | null) {
    setUrls((prev: Record<Side, string | null>) => ({ ...prev, [side]: url }));
    if (side === "front") onFrontChange?.(url);
    else onBackChange?.(url);
  }

  async function upload(side: Side, file: File) {
    setErrors((prev: Record<Side, string | null>) => ({ ...prev, [side]: null }));
    if (file.size > maxMb * 1024 * 1024) {
      setErrors((prev: Record<Side, string | null>) => ({ ...prev, [side]: `Supera ${maxMb} MB.` }));
      return;
    }
    setUploading((prev: Record<Side, boolean>) => ({ ...prev, [side]: true }));
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/upload/card-image", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "No se pudo subir.");
      setUrl(side, data.url);
    } catch (err) {
      setErrors((prev: Record<Side, string | null>) => ({
        ...prev,
        [side]: err instanceof Error ? err.message : "Error.",
      }));
    } finally {
      setUploading((prev: Record<Side, boolean>) => ({ ...prev, [side]: false }));
    }
  }

  function handlePick(side: Side, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void upload(side, file);
    e.target.value = "";
  }

  const sides: { side: Side; label: string; ref: React.RefObject<HTMLInputElement | null> }[] = [
    { side: "front", label: "Frente", ref: frontRef },
    { side: "back", label: "Reverso", ref: backRef },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-3">
        {sides.map(({ side, label, ref }) => (
          <div key={side} className="flex flex-col items-center gap-1.5">
            <div className="relative aspect-[3/4] w-[88px] overflow-hidden rounded-lg border border-[var(--glass-border)] bg-[var(--glass-fill)]">
              {urls[side] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urls[side]!} alt={label} className="h-full w-full object-cover" />
                  {uploading[side] && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setUrl(side, null)}
                    disabled={uploading[side]}
                    aria-label={`Quitar ${label}`}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600 disabled:opacity-60"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => ref.current?.click()}
                  disabled={uploading[side]}
                  className="grid h-full w-full place-items-center hover:bg-white/5 disabled:opacity-60"
                >
                  {uploading[side] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--ink-mute)]" />
                  ) : (
                    <ImagePlus className="h-4 w-4 text-[var(--ink-mute)]" />
                  )}
                </button>
              )}
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                {label}
              </p>
              {urls[side] ? (
                <button
                  type="button"
                  onClick={() => ref.current?.click()}
                  disabled={uploading[side]}
                  className="text-[0.625rem] font-medium text-[var(--accent-hi)] hover:underline disabled:opacity-60"
                >
                  Cambiar
                </button>
              ) : null}
              {errors[side] && (
                <p role="alert" className="text-[0.625rem] text-[var(--bad)]">
                  {errors[side]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <input
        ref={frontRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handlePick("front", e)}
      />
      <input
        ref={backRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handlePick("back", e)}
      />
    </div>
  );
}
