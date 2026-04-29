import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthenticatedUser } from "@/lib/server/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell
      username={user.username ?? user.email ?? "Vendedor"}
      logoutSlot={<LogoutButton />}
    >
      {children}
    </DashboardShell>
  );
}
