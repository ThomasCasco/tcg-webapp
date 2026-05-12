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
            className={`flex items-center gap-2.5 rounded-[var(--r-sm)] px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "[background:rgba(var(--accent-glow),0.15)] border border-[rgba(var(--accent-glow),0.3)] text-[var(--accent-hi)]"
                : "text-[var(--ink-mute)] hover:bg-white/5 hover:text-[var(--ink)]"
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
