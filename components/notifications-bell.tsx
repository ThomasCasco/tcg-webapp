"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function NotificationsBell() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/notifications?unreadOnly=1&limit=50", {
          cache: "no-store",
        });
        const data = (await response.json()) as { unreadCount?: number };
        if (!cancelled) setCount(data.unreadCount ?? 0);
      } catch {
        // silent
      }
    }

    void load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link
      href="/alerts"
      className="relative rounded-full border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-white/70"
    >
      Alertas
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
