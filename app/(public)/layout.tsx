import { TopBar } from "@/components/layout/top-bar";
import { PublicFooter } from "@/components/layout/public-footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getAuthenticatedUser } from "@/lib/server/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  return (
    <div className="flex min-h-svh flex-col">
      <TopBar user={user ? { username: user.username, email: user.email } : null} />
      {/* Signed-in users keep the bottom nav on public pages (e.g. the market) too. */}
      <main className={user ? "flex-1 pb-24 md:pb-0" : "flex-1"}>{children}</main>
      <PublicFooter />
      {user ? <BottomNav /> : null}
    </div>
  );
}
