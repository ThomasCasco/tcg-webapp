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
    <div className="flex min-h-svh flex-col">
      <TopBar user={user} />
      <div className="flex flex-1 md:flex-row">
        <DashboardSidebar />
        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-10 md:pt-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
