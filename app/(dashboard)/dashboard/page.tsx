import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import {
  getMpConnectionStatus,
  getSellerPaymentProfile,
  getSocialProfile,
  listAuctions,
  listInventoryEntries,
  listListings,
  listTransactionsForUser,
  listTradeProposalsForUser,
  listNotificationsForUser,
} from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import {
  SellerSetupChecklist,
  type ChecklistStep,
} from "@/components/seller-setup-checklist";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  ArrowLeftRight,
  ArrowRight,
  Bell,
  CalendarClock,
  Gavel,
  Info,
  Layers,
  Package,
  ShoppingBag,
  Tag,
  Wallet,
} from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  if (!isSupabaseConfigured()) {
    return (
      <section className="space-y-4">
        <Card padding="lg">
          <h1 className="text-h1 [font-family:var(--font-display)]">¡Hola!</h1>
          <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
            Configurá Supabase para usar el dashboard.
          </p>
        </Card>
      </section>
    );
  }

  const [
    profile,
    sellerPayment,
    mpStatus,
    inventory,
    myListings,
    myAuctions,
    transactions,
    proposals,
    notifications,
  ] = await Promise.all([
    getSocialProfile(user.id).catch(() => null),
    getSellerPaymentProfile(user.id).catch(() => null),
    getMpConnectionStatus(user.id).catch(() => ({ mpConnected: false, mpUserId: null })),
    listInventoryEntries({ ownerId: user.id }).catch(() => []),
    listListings({ sellerId: user.id }).catch(() => []),
    listAuctions({ sellerId: user.id, viewerUserId: user.id }).catch(() => []),
    listTransactionsForUser(user.id).catch(() => []),
    listTradeProposalsForUser(user.id).catch(() => []),
    listNotificationsForUser(user.id, { unreadOnly: true, limit: 1 }).catch(() => []),
  ]);

  // Redirect brand-new users to onboarding wizard
  const isNewUser =
    !profile?.displayName &&
    !profile?.avatarUrl &&
    !profile?.onboardingCompletedAt;
  if (isNewUser) redirect("/onboarding");

  const hasProfile = Boolean(profile?.displayName || profile?.bio);
  const hasAvatar = Boolean(profile?.avatarUrl);
  const hasMp = mpStatus.mpConnected;
  const hasPaymentFallback = Boolean(
    sellerPayment?.paymentAlias || sellerPayment?.paymentInstructions,
  );
  const hasInventory = inventory.length > 0;
  const hasListing = myListings.length > 0;

  const steps: ChecklistStep[] = [
    {
      key: "profile",
      title: "Completá tu perfil",
      description: "Nombre visible, foto y bio. Da confianza al comprar y vender.",
      href: "/account",
      done: hasProfile && hasAvatar,
    },
    {
      key: "mp",
      title: "Conectá Mercado Pago",
      description:
        "Recomendado. Cobros verificados automáticamente, menos fricción para el comprador.",
      href: "/account",
      done: hasMp,
      cta: "Conectar",
    },
    {
      key: "fallback-payment",
      title: "Cargá un método P2P de respaldo",
      description: "Alias, CBU o instrucciones para vender sin MP.",
      href: "/account",
      done: hasPaymentFallback,
    },
    {
      key: "inventory",
      title: "Cargá tu primera carta",
      description: "Sin inventario no podés publicar ni intercambiar.",
      href: "/inventory",
      done: hasInventory,
    },
    {
      key: "listing",
      title: "Publicá una carta",
      description: "Probá el flujo completo. Hasta que no hay publicación no vendés nada.",
      href: "/listings",
      done: hasListing,
    },
  ];

  const pendingTransactions = transactions.filter(
    (transaction) =>
      transaction.fulfillmentStatus &&
      ["pending", "seller_confirmed", "shipped"].includes(transaction.fulfillmentStatus),
  ).length;
  const pendingProposals = proposals.filter((proposal) => proposal.status === "pending").length;
  const scheduledAuctions = myAuctions.filter((auction) => auction.status === "scheduled").length;
  const activeAuctions = myAuctions.filter((auction) => auction.status === "active").length;
  const hasUnread = notifications.length > 0;

  const displayName = profile?.displayName?.trim() || user.username;

  return (
    <section className="space-y-5">
      <Card as="header" padding="lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Dashboard</p>
            <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
              Hola, {displayName}
            </h1>
            <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
              Acá tenés todo en un vistazo. Sos lo que necesitas en el momento:
              comprador, vendedor o coleccionista que intercambia.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/how-it-works">
                <Info className="h-4 w-4" />
                Cómo funciona
              </Link>
            </Button>
            {hasUnread ? (
              <Button asChild variant="ghost">
                <Link href="/alerts">
                  <Bell className="h-4 w-4" />
                  Tenés novedades
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <SellerSetupChecklist steps={steps} />

      <section className="grid gap-4 md:grid-cols-3">
        <ContextCard
          icon={<ShoppingBag className="h-5 w-5" />}
          eyebrow="Comprar"
          title="Buscás algo"
          description="Mercado, subastas y alertas para que no se te escapen las cartas que te faltan."
          links={[
            { href: "/market", label: "Mercado" },
            { href: "/auctions", label: "Subastas" },
            { href: "/claims", label: "Claims en vivo" },
            { href: "/alerts", label: "Mis alertas" },
            { href: "/transactions", label: `Mis compras${pendingTransactions ? ` (${pendingTransactions})` : ""}` },
          ]}
        />
        <ContextCard
          icon={<Tag className="h-5 w-5" />}
          eyebrow="Vender"
          title="Tenés cartas para mover"
          description="Cargá stock, publicá precios o programá una subasta."
          links={[
            { href: "/inventory", label: `Inventario (${inventory.length})` },
            { href: "/listings", label: `Mis ventas (${myListings.length})` },
            { href: "/my-auctions", label: `Mis subastas${myAuctions.length ? ` (${myAuctions.length})` : ""}` },
            { href: "/my-claims", label: "Mis claims" },
            { href: "/account", label: "Cobros y MP" },
          ]}
        />
        <ContextCard
          icon={<ArrowLeftRight className="h-5 w-5" />}
          eyebrow="Intercambiar"
          title="Querés tradear"
          description="Cartas que ofrecés y que buscás. Otros coleccionistas te proponen swaps."
          links={[
            { href: "/trades", label: "Explorar trades" },
            { href: "/inventory", label: "Marcar disponibles" },
            {
              href: "/trade-proposals",
              label: `Propuestas${pendingProposals ? ` (${pendingProposals})` : ""}`,
            },
            { href: "/profiles", label: "Perfiles" },
          ]}
        />
      </section>

      {(scheduledAuctions > 0 || activeAuctions > 0 || pendingTransactions > 0 || pendingProposals > 0) ? (
        <Card padding="md">
          <p className="text-overline text-[var(--color-ink-subtle)]">Lo que tenés activo</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingTransactions > 0 ? (
              <ActivityChip
                href="/transactions"
                icon={<Package className="h-3 w-3" />}
                variant="warning"
                label={`${pendingTransactions} operación${pendingTransactions === 1 ? "" : "es"} en curso`}
              />
            ) : null}
            {pendingProposals > 0 ? (
              <ActivityChip
                href="/trade-proposals"
                icon={<ArrowLeftRight className="h-3 w-3" />}
                variant="info"
                label={`${pendingProposals} propuesta${pendingProposals === 1 ? "" : "s"} de trade`}
              />
            ) : null}
            {scheduledAuctions > 0 ? (
              <ActivityChip
                href="/my-auctions"
                icon={<CalendarClock className="h-3 w-3" />}
                variant="info"
                label={`${scheduledAuctions} subasta${scheduledAuctions === 1 ? "" : "s"} programada${scheduledAuctions === 1 ? "" : "s"}`}
              />
            ) : null}
            {activeAuctions > 0 ? (
              <ActivityChip
                href="/my-auctions"
                icon={<Gavel className="h-3 w-3" />}
                variant="success"
                label={`${activeAuctions} subasta${activeAuctions === 1 ? "" : "s"} en vivo`}
              />
            ) : null}
          </div>
        </Card>
      ) : null}

      {!hasInventory && !hasListing ? (
        <Card padding="lg" className="text-center">
          <Layers className="mx-auto h-10 w-10 text-[var(--color-ink-subtle)]" />
          <h2 className="mt-3 text-h3">¿Recién empezás?</h2>
          <p className="mx-auto mt-1 max-w-md text-body-sm text-[var(--color-ink-muted)]">
            Mirá la guía para entender cómo funcionan el marketplace, los trades
            y las subastas. Te ahorra muchas vueltas.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button asChild>
              <Link href="/how-it-works">
                Leer la guía
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/market">Explorar mercado</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      {!hasMp ? (
        <Card padding="md" className="border-[var(--color-info)] bg-[var(--color-info-soft)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-[var(--radius-card)] bg-[var(--color-info)] text-white">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <p className="text-body-sm font-semibold">
                  Conectá Mercado Pago para vender mejor
                </p>
                <p className="text-caption text-[var(--color-ink-muted)]">
                  Sin MP los compradores ven el badge &quot;Pago P2P&quot; y suelen dudar más.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/account">Conectar MP</Link>
            </Button>
          </div>
        </Card>
      ) : null}
    </section>
  );
}

function ContextCard({
  icon,
  eyebrow,
  title,
  description,
  links,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <Card padding="lg" className="flex h-full flex-col gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-[var(--r-xs)] border border-[var(--glass-border)] bg-[var(--bg-2)] text-[var(--accent-hi)]">
        {icon}
      </div>
      <div>
        <p className="text-overline text-[var(--color-ink-subtle)]">{eyebrow}</p>
        <h3 className="mt-1 text-h3">{title}</h3>
        <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">{description}</p>
      </div>
      <ul className="mt-auto flex flex-col gap-1.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center justify-between rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-fill)] px-3 py-2 text-body-sm font-semibold transition-colors hover:border-[var(--accent-hi)] hover:bg-[rgba(var(--accent-glow),0.15)] hover:text-[var(--accent-hi)]"
            >
              <span>{link.label}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ActivityChip({
  href,
  icon,
  label,
  variant,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  variant: "success" | "warning" | "info";
}) {
  return (
    <Link href={href} className="inline-flex">
      <Chip variant={variant} size="md">
        {icon}
        {label}
      </Chip>
    </Link>
  );
}
