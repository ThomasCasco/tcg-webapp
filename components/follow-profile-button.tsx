"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  followingId: string;
  initialFollowing: boolean;
  disabled?: boolean;
};

export function FollowProfileButton({ followingId, initialFollowing, disabled }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const response = await fetch("/api/profiles/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId, follow: !following }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "No se pudo actualizar.");
      }
      setFollowing((value) => !value);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={following ? "secondary" : "primary"}
      onClick={toggle}
      loading={loading}
      disabled={disabled}
    >
      {following ? "Siguiendo" : "Seguir"}
    </Button>
  );
}
