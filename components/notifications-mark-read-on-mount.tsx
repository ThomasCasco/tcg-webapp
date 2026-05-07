"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function NotificationsMarkReadOnMount({ ids }: { ids: string[] }) {
  const router = useRouter();

  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    void fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then(() => {
        if (!cancelled) router.refresh();
      })
      .catch(() => {
        // silent
      });
    return () => {
      cancelled = true;
    };
  }, [ids, router]);

  return null;
}
