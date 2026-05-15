import Image from "next/image";
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
 */
export function Logo({ className, alt = "TCG.ar" }: LogoProps) {
  return (
    <>
      <Image
        src="/img/logo-dark.png"
        alt={alt}
        width={891}
        height={601}
        priority
        className={cn("logo-dark block w-auto", className)}
      />
      <Image
        src="/img/logo-light.png"
        alt=""
        aria-hidden="true"
        width={891}
        height={601}
        className={cn("logo-light hidden w-auto", className)}
      />
    </>
  );
}
