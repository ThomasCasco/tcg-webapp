"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

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
    <Button asChild variant="ghost" size="sm" aria-label="Alertas y notificaciones" className="relative">
      <Link href="/alerts">
        <Bell className="h-5 w-5" aria-hidden />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[0.625rem] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
