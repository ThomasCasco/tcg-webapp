"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type LinkItem = { href: string; label: string; icon: string };

export function SidebarNav({ links }: { links: LinkItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {links.map((link) => {
        const active = pathname === link.href || pathname?.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {link.icon}
            </span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
