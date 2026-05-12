"use client";
import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ endsAt, className }: { endsAt: Date | string | number; className?: string }) {
  const target = typeof endsAt === "object" ? endsAt.getTime() : new Date(endsAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const ms = Math.max(0, target - now);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return (
    <span className={className ?? "t-mono font-bold"}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
