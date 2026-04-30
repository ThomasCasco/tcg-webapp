import * as React from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export interface DashboardShellProps {
  username: string;
  logoutSlot: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({ username, logoutSlot, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <DashboardSidebar username={username} logoutSlot={logoutSlot} />
      <main className="flex-1 px-4 pb-20 pt-3 md:px-8 md:pb-8 md:pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
