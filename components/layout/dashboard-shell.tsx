import * as React from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { TopBar } from "@/components/layout/top-bar";

export interface DashboardShellProps {
  user: { username: string; email?: string };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--color-surface)]">
      <TopBar user={user} />
      <div className="flex flex-1 md:flex-row">
        <DashboardSidebar />
        <main className="flex-1 px-3 pb-24 pt-3 md:px-8 md:pb-12 md:pt-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
