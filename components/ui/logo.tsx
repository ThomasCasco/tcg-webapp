import { cn } from "@/lib/ui/cn";

export interface LogoProps {
  /** Render size; both variants ship at 891×601 so any height works. */
  className?: string;
  alt?: string;
}

/**
 * Brand mark. Renders two raster variants (dark + light theme) and lets CSS
 * pick the right one based on `[data-theme]` on the <html> element. Default
 * is dark since the site ships with `data-theme="dark"`/no-attribute.
 *
 * The dual-PNG approach avoids the prior hack of recoloring a single PNG with
 * blend modes — the "C" stroke is black in the source logo (designed for a
 * white bg). On dark UI it needs to be white; on light UI it must stay black.
 */
export function Logo({ className, alt = "TCG.ar" }: LogoProps) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/logo-dark.png"
        alt={alt}
        className={cn("logo-dark block w-auto", className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/logo-light.png"
        alt=""
        aria-hidden="true"
        className={cn("logo-light hidden w-auto", className)}
      />
    </>
  );
}
