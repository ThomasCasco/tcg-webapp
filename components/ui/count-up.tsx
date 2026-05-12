"use client";
import { useEffect, useRef, useState } from "react";

export interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1100,
  decimals = 0,
  className,
}: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    let raf = 0;
    let t0: number | null = null;
    let done = false;
    const step = (t: number) => {
      if (t0 === null) t0 = t;
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (p < 1) raf = requestAnimationFrame(step);
      else {
        done = true;
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(step);
    const fb = window.setTimeout(() => {
      if (!done) {
        setDisplay(to);
        fromRef.current = to;
      }
    }, duration + 100);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fb);
    };
  }, [value, duration]);

  const formatted = decimals
    ? display.toLocaleString("es-AR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : Math.round(display).toLocaleString("es-AR");

  return (
    <span className={className ?? "t-mono"}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
