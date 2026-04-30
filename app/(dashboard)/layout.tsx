import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthenticatedUser } from "@/lib/server/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell user={{ username: user.username, email: user.email }}>
      {children}
    </DashboardShell>
  );
}
