"use client";
/**
 * UserMenu — avatar trigger with dropdown of account actions.
 *
 * Closes on click-outside, Escape, or selection.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  ChevronDown,
  User,
  Wallet,
  LogOut,
  Home,
  Info,
} from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

type Props = {
  username: string;
  email?: string;
  onLogout?: () => void;
};

// Keep this short — sidebar covers the rest.
const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/account", label: "Mi cuenta y cobros", icon: Wallet },
  { href: "/how-it-works", label: "Cómo funciona", icon: Info },
];

export function UserMenu({ username, email, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full p-0.5 transition-colors hover:bg-black/5"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de usuario"
      >
        <Avatar name={username} size="sm" />
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[var(--color-ink-muted)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card-lg)]"
        >
          <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] p-3">
            <Avatar name={username} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-semibold text-[var(--color-ink)]">
                @{username}
              </p>
              {email && (
                <p className="truncate text-caption text-[var(--color-ink-muted)]">
                  {email}
                </p>
              )}
            </div>
          </div>

          <ul className="py-1">
            <li>
              <Link
                href={`/u/${username}`}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-3 px-3 py-2 text-body-sm text-[var(--color-ink)] hover:bg-[var(--color-accent-soft)]/40"
              >
                <User className="h-4 w-4 text-[var(--color-ink-muted)]" />
                Ver mi perfil publico
              </Link>
            </li>
            {items.map(({ href, label, icon: Icon }) => (
              <li key={`${href}-${label}`}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-3 px-3 py-2 text-body-sm text-[var(--color-ink)] hover:bg-[var(--color-accent-soft)]/40"
                >
                  <Icon className="h-4 w-4 text-[var(--color-ink-muted)]" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {onLogout && (
            <div className="border-t border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                role="menuitem"
                className="flex w-full items-center gap-3 px-3 py-2 text-body-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
