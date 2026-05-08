import { TopBar } from "@/components/layout/top-bar";
import { PublicFooter } from "@/components/layout/public-footer";
import { getAuthenticatedUser } from "@/lib/server/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  return (
    <div className="premium-page flex min-h-svh flex-col">
      <TopBar user={user ? { username: user.username, email: user.email } : null} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
