import type {
  CardCondition,
  CardWatch,
  AuctionBid,
  AuctionListing,
  AuctionStatus,
  ClaimSession,
  ClaimSessionCard,
  ClaimCardStatus,
  ClaimSessionStatus,
  DisputeEvent,
  DisputeStatus,
  FulfillmentStatus,
  InventoryEntry,
  Listing,
  ListingStatus,
  ListingType,
  Notification,
  PaymentEvent,
  PaymentEventWithListing,
  PaymentProvider,
  PublicProfileDetail,
  TransactionChatMessage,
  PaymentVerificationStatus,
  SellerPaymentDetails,
  SellerPaymentProfile,
  SellerPaymentProvider,
  SocialProfile,
  TradeProposal,
  TradeProposalStatus,
  TradeProfile,
} from "@/lib/domain/types";
import { assertListingLogisticsValid } from "@/lib/shared/listing-logistics";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/server/supabase";

const INVENTORY_TABLE = "inventory_entries";
const LISTINGS_TABLE = "market_listings";
const PAYMENTS_TABLE = "payment_events";
const DISPUTES_TABLE = "dispute_events";
const WATCHES_TABLE = "card_watches";
const NOTIFICATIONS_TABLE = "notifications";
const PROFILES_TABLE = "profiles";
const CHAT_MESSAGES_TABLE = "transaction_chat_messages";
const PROFILE_FOLLOWS_TABLE = "profile_follows";
const TRADE_PROPOSALS_TABLE = "trade_proposals";
const AUCTIONS_TABLE = "auction_listings";
const AUCTION_BIDS_TABLE = "auction_bids";
const CLAIM_SESSIONS_TABLE = "claim_sessions";
const CLAIM_CARDS_TABLE = "claim_session_cards";
const SOCIAL_PROFILE_SELECT =
  "id,username,display_name,bio,location,avatar_url,favorite_game,favorite_card,instagram,discord,whatsapp,payment_provider,payment_alias,payment_instructions,onboarding_completed_at,created_at,updated_at";

const SUCCESS_PROVIDER_STATUSES = new Set(["approved", "accredited", "succeeded"]);

type InventoryRow = {
  id: string;
  owner_id: string | null;
  seller_handle: string;
  card_name: string;
  set_name: string | null;
  catalog_card_id: string | null;
  image_url: string | null;
  condition: CardCondition;
  quantity: number;
  asking_price_ars: number | null;
  available_for_trade?: boolean | null;
  trade_notes?: string | null;
  created_at: string;
};

type ListingRow = {
  id: string;
  seller_id: string | null;
  seller_handle: string;
  inventory_entry_id: string | null;
  card_name: string;
  set_name: string;
  catalog_card_id: string | null;
  image_url: string | null;
  condition: CardCondition;
  price_ars: number;
  quantity: number;
  status: ListingStatus;
  listing_type: ListingType | null;
  pack_card_count: number | null;
  pack_rarity_floor: string | null;
  pack_theme: string | null;
  pack_description: string | null;
  created_at: string;
  reserved_at?: string | null;
  offers_shipping?: boolean | null;
  offers_pickup?: boolean | null;
  delivery_area_notes?: string | null;
};

type WatchRow = {
  id: string;
  user_id: string;
  profiles?: { username: string | null } | null;
  query: string;
  max_price_ars: number | null;
  public_wanted?: boolean | null;
  notes?: string | null;
  created_at: string;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: Notification["type"];
  title: string;
  body: string;
  link_path: string | null;
  read_at: string | null;
  created_at: string;
};

type ChatMessageRow = {
  id: string;
  transaction_id: string;
  sender_id: string;
  sender_handle: string;
  body: string;
  created_at: string;
};

type PaymentRow = {
  id: string;
  transaction_id: string;
  listing_id: string | null;
  auction_id?: string | null;
  seller_id?: string | null;
  seller_handle?: string | null;
  buyer_id: string | null;
  buyer_handle: string;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  provider_status: string;
  verification_status: PaymentVerificationStatus;
  fulfillment_status: FulfillmentStatus;
  shipping_tracking: string | null;
  mp_preference_id?: string | null;
  mp_checkout_url?: string | null;
  platform_fee_ars?: number | null;
  mp_payment_id?: string | null;
  checked_at: string;
  created_at: string;
};

type ClaimSessionRow = {
  id: string;
  seller_id: string;
  seller_handle: string;
  title: string;
  description: string | null;
  status: ClaimSessionStatus;
  created_at: string;
  ended_at: string | null;
};

type ClaimCardRow = {
  id: string;
  session_id: string;
  inventory_entry_id: string | null;
  card_name: string;
  set_name: string | null;
  image_url: string | null;
  condition: CardCondition;
  price_ars: number;
  order_index: number;
  status: ClaimCardStatus;
  claimed_by_user_id: string | null;
  claimed_by_handle: string | null;
  claimed_at: string | null;
  created_at: string;
};

type DisputeRow = {
  id: string;
  transaction_id: string;
  opened_by_id: string | null;
  opened_by_handle: string;
  reason: string;
  details: string;
  status: DisputeStatus;
  created_at: string;
  resolved_at: string | null;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name?: string | null;
  bio?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  favorite_game?: string | null;
  favorite_card?: string | null;
  instagram?: string | null;
  discord?: string | null;
  whatsapp: string | null;
  payment_provider: SellerPaymentProvider | null;
  payment_alias: string | null;
  payment_instructions: string | null;
  onboarding_completed_at?: string | null;
  created_at?: string | null;
  updated_at: string;
};

type TradeProposalRow = {
  id: string;
  proposer_id: string;
  proposer_handle: string;
  recipient_id: string;
  recipient_handle: string;
  offered_inventory_ids: string[] | null;
  requested_inventory_ids: string[] | null;
  message: string | null;
  status: TradeProposalStatus;
  proposer_confirmed_at?: string | null;
  recipient_confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
};

type AuctionRow = {
  id: string;
  seller_id: string | null;
  seller_handle: string;
  inventory_entry_id: string | null;
  card_name: string;
  set_name: string | null;
  catalog_card_id: string | null;
  image_url: string | null;
  condition: CardCondition;
  quantity: number;
  status: AuctionStatus;
  start_price_ars: number;
  bid_increment_ars: number;
  current_price_ars: number;
  buyout_price_ars: number | null;
  bid_count: number | null;
  winner_id: string | null;
  winner_handle: string | null;
  starts_at: string;
  ends_at: string;
  created_at: string;
  offers_shipping?: boolean | null;
  offers_pickup?: boolean | null;
  delivery_area_notes?: string | null;
};

type AuctionBidRow = {
  id: string;
  auction_id: string;
  bidder_id: string;
  bidder_handle: string;
  amount_ars: number;
  created_at: string;
};

type CreateInventoryInput = {
  ownerId: string;
  sellerHandle: string;
  cardName: string;
  setName?: string;
  catalogCardId?: string;
  imageUrl?: string;
  condition: CardCondition;
  quantity: number;
  askingPriceArs?: number;
  availableForTrade?: boolean;
  tradeNotes?: string;
};

type CreateListingInput = {
  sellerId: string;
  sellerHandle: string;
  inventoryId?: string;
  cardName: string;
  setName: string;
  catalogCardId?: string;
  imageUrl?: string;
  condition: CardCondition;
  priceArs: number;
  quantity: number;
  listingType?: ListingType;
  packCardCount?: number;
  packRarityFloor?: string;
  packTheme?: string;
  packDescription?: string;
  offersShipping: boolean;
  offersPickup: boolean;
  deliveryAreaNotes: string;
};

type ReserveListingInput = {
  listingId: string;
  buyerId: string;
  buyerHandle: string;
};

type VerifyTransactionInput = {
  transactionId: string;
  actorUserId?: string;
  bypassOwnership?: boolean;
  provider: PaymentProvider;
  providerPaymentId: string;
  providerStatus: string;
};

type UpdateInventoryInput = {
  entryId: string;
  ownerId: string;
  askingPriceArs?: number;
  quantity?: number;
  imageUrl?: string | null;
  availableForTrade?: boolean;
  tradeNotes?: string | null;
};

type UpdateListingInput = {
  listingId: string;
  sellerId: string;
  priceArs?: number;
  quantity?: number;
  imageUrl?: string | null;
  offersShipping?: boolean;
  offersPickup?: boolean;
  deliveryAreaNotes?: string | null;
};

type CancelListingInput = {
  listingId: string;
  sellerId: string;
};

type UpdateFulfillmentInput = {
  transactionId: string;
  actorUserId: string;
  nextStatus: FulfillmentStatus;
  trackingNumber?: string;
};

type CreateDisputeInput = {
  transactionId: string;
  openedById: string;
  openedByHandle: string;
  reason: string;
  details: string;
};

type UpdateSellerPaymentProfileInput = {
  userId: string;
  whatsapp?: string;
  paymentProvider: SellerPaymentProvider;
  paymentAlias?: string;
  paymentInstructions?: string;
};

export type MpPaymentValidationContext = {
  transactionId: string;
  listingId: string;
  expectedAmountArs: number;
  expectedCurrencyId: "ARS";
  expectedSellerMpUserId: string;
  expectedPreferenceId?: string;
  expectedPlatformFeeArs?: number;
};

type UpdateSocialProfileInput = {
  userId: string;
  displayName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  favoriteGame?: string;
  favoriteCard?: string;
  instagram?: string;
  discord?: string;
};

type CreateAuctionInput = {
  sellerId: string;
  sellerHandle: string;
  inventoryId: string;
  cardName: string;
  setName?: string;
  catalogCardId?: string;
  imageUrl?: string;
  condition: CardCondition;
  quantity: number;
  startPriceArs: number;
  bidIncrementArs: number;
  buyoutPriceArs?: number;
  durationHours: number;
  /** Si se manda, la subasta queda "scheduled" hasta esa fecha. */
  scheduledStartAt?: string;
  offersShipping: boolean;
  offersPickup: boolean;
  deliveryAreaNotes: string;
};

const AUCTION_SUBSCRIPTIONS_TABLE = "auction_subscriptions";

function mapInventoryRow(row: InventoryRow): InventoryEntry {
  return {
    id: row.id,
    ownerId: row.owner_id ?? undefined,
    sellerHandle: row.seller_handle,
    cardName: row.card_name,
    setName: row.set_name ?? undefined,
    catalogCardId: row.catalog_card_id ?? undefined,
    imageUrl: row.image_url ?? undefined,
    condition: row.condition,
    quantity: row.quantity,
    askingPriceArs: row.asking_price_ars ?? undefined,
    availableForTrade: Boolean(row.available_for_trade),
    tradeNotes: row.trade_notes?.trim() || undefined,
    createdAt: row.created_at,
  };
}

function mapListingRow(row: ListingRow): Listing {
  return {
    id: row.id,
    sellerId: row.seller_id ?? undefined,
    sellerHandle: row.seller_handle,
    inventoryId: row.inventory_entry_id ?? undefined,
    cardName: row.card_name,
    setName: row.set_name,
    catalogCardId: row.catalog_card_id ?? undefined,
    imageUrl: row.image_url ?? undefined,
    condition: row.condition,
    priceArs: row.price_ars,
    quantity: row.quantity,
    status: row.status,
    listingType: row.listing_type ?? "single",
    packCardCount: row.pack_card_count ?? undefined,
    packRarityFloor: row.pack_rarity_floor ?? undefined,
    packTheme: row.pack_theme ?? undefined,
    packDescription: row.pack_description ?? undefined,
    reservedAt: row.reserved_at ? String(row.reserved_at) : undefined,
    createdAt: row.created_at,
    offersShipping: Boolean(row.offers_shipping),
    offersPickup: Boolean(row.offers_pickup),
    deliveryAreaNotes: row.delivery_area_notes?.trim() || undefined,
  };
}

function mapWatchRow(row: WatchRow): CardWatch {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.profiles?.username ?? undefined,
    query: row.query,
    maxPriceArs: row.max_price_ars ?? undefined,
    publicWanted: Boolean(row.public_wanted),
    notes: row.notes?.trim() || undefined,
    createdAt: row.created_at,
  };
}

function mapNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkPath: row.link_path ?? undefined,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  };
}

function mapChatMessageRow(row: ChatMessageRow): TransactionChatMessage {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    senderId: row.sender_id,
    senderHandle: row.sender_handle,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapPaymentRow(row: PaymentRow): PaymentEvent {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    listingId: row.listing_id ?? "",
    auctionId: row.auction_id ?? undefined,
    sellerId: row.seller_id ?? undefined,
    sellerHandle: row.seller_handle ?? undefined,
    buyerId: row.buyer_id ?? undefined,
    buyerHandle: row.buyer_handle,
    provider: row.provider,
    providerPaymentId: row.provider_payment_id ?? undefined,
    providerStatus: row.provider_status,
    verificationStatus: row.verification_status,
    fulfillmentStatus: row.fulfillment_status,
    shippingTracking: row.shipping_tracking ?? undefined,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
  };
}

function mapClaimSessionRow(row: ClaimSessionRow, cards?: ClaimCardRow[]): ClaimSession {
  const mappedCards = cards?.map(mapClaimCardRow);
  const remaining = mappedCards?.filter((c) => c.status === "pending" || c.status === "available").length ?? 0;
  const claimed = mappedCards?.filter((c) => c.status === "claimed").length ?? 0;
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerHandle: row.seller_handle,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    endedAt: row.ended_at ?? undefined,
    cards: mappedCards,
    remainingCount: remaining,
    claimedCount: claimed,
  };
}

function mapClaimCardRow(row: ClaimCardRow): ClaimSessionCard {
  return {
    id: row.id,
    sessionId: row.session_id,
    inventoryEntryId: row.inventory_entry_id ?? undefined,
    cardName: row.card_name,
    setName: row.set_name ?? undefined,
    imageUrl: row.image_url ?? undefined,
    condition: row.condition,
    priceArs: row.price_ars,
    orderIndex: row.order_index,
    status: row.status,
    claimedByUserId: row.claimed_by_user_id ?? undefined,
    claimedByHandle: row.claimed_by_handle ?? undefined,
    claimedAt: row.claimed_at ?? undefined,
    createdAt: row.created_at,
  };
}

function mapDisputeRow(row: DisputeRow): DisputeEvent {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    openedById: row.opened_by_id ?? undefined,
    openedByHandle: row.opened_by_handle,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? undefined,
  };
}

function mapSellerPaymentProfile(row: ProfileRow): SellerPaymentProfile {
  return {
    userId: row.id,
    username: row.username,
    whatsapp: row.whatsapp ?? undefined,
    paymentProvider: row.payment_provider ?? "mercado_pago",
    paymentAlias: row.payment_alias ?? undefined,
    paymentInstructions: row.payment_instructions ?? undefined,
    updatedAt: row.updated_at,
  };
}

function mapSellerPaymentDetails(row: ProfileRow): SellerPaymentDetails {
  return {
    sellerId: row.id,
    sellerHandle: row.username,
    whatsapp: row.whatsapp ?? undefined,
    paymentProvider: row.payment_provider ?? "mercado_pago",
    paymentAlias: row.payment_alias ?? undefined,
    paymentInstructions: row.payment_instructions ?? undefined,
  };
}

function profileCompletionScore(row: ProfileRow, counts?: {
  tradeCount?: number;
  wantedCount?: number;
  listingCount?: number;
  followersCount?: number;
}): number {
  const checks = [
    row.username,
    row.display_name,
    row.avatar_url,
    row.bio && row.bio.length >= 24 ? row.bio : "",
    row.location,
    row.favorite_game,
    row.favorite_card,
    row.instagram || row.discord || row.whatsapp,
    (counts?.tradeCount ?? 0) > 0 ? "trade" : "",
    (counts?.wantedCount ?? 0) > 0 ? "wanted" : "",
    (counts?.listingCount ?? 0) > 0 ? "listing" : "",
    (counts?.followersCount ?? 0) > 0 ? "followers" : "",
  ];

  const completed = checks.filter((value) => Boolean(String(value ?? "").trim())).length;
  return Math.round((completed / checks.length) * 100);
}

function mapSocialProfile(
  row: ProfileRow,
  counts?: {
    tradeCount?: number;
    wantedCount?: number;
    listingCount?: number;
    followersCount?: number;
    followingCount?: number;
  },
): SocialProfile {
  const tradeCount = counts?.tradeCount ?? 0;
  const wantedCount = counts?.wantedCount ?? 0;
  const listingCount = counts?.listingCount ?? 0;
  const followersCount = counts?.followersCount ?? 0;
  const followingCount = counts?.followingCount ?? 0;
  const badges = [
    row.bio && row.avatar_url ? "Perfil cuidado" : "",
    tradeCount > 0 && wantedCount > 0 ? "Trader activo" : "",
    listingCount >= 3 ? "Vendedor activo" : "",
    followersCount >= 5 ? "Conocido en la comunidad" : "",
  ].filter(Boolean);

  return {
    userId: row.id,
    username: row.username,
    displayName: row.display_name?.trim() || undefined,
    bio: row.bio?.trim() || undefined,
    location: row.location?.trim() || undefined,
    avatarUrl: row.avatar_url?.trim() || undefined,
    favoriteGame: row.favorite_game?.trim() || undefined,
    favoriteCard: row.favorite_card?.trim() || undefined,
    instagram: row.instagram?.trim() || undefined,
    discord: row.discord?.trim() || undefined,
    completionScore: profileCompletionScore(row, {
      tradeCount,
      wantedCount,
      listingCount,
      followersCount,
    }),
    tradeCount,
    wantedCount,
    listingCount,
    followersCount,
    followingCount,
    badges,
    joinedAt: row.created_at ?? undefined,
    updatedAt: row.updated_at,
    onboardingCompletedAt: row.onboarding_completed_at ?? undefined,
  };
}

function mapTradeProposal(row: TradeProposalRow): TradeProposal {
  return {
    id: row.id,
    proposerId: row.proposer_id,
    proposerHandle: row.proposer_handle,
    recipientId: row.recipient_id,
    recipientHandle: row.recipient_handle,
    offeredInventoryIds: row.offered_inventory_ids ?? [],
    requestedInventoryIds: row.requested_inventory_ids ?? [],
    message: row.message?.trim() || undefined,
    status: row.status,
    proposerConfirmedAt: row.proposer_confirmed_at ?? undefined,
    recipientConfirmedAt: row.recipient_confirmed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuctionRow(row: AuctionRow): AuctionListing {
  return {
    id: row.id,
    sellerId: row.seller_id ?? undefined,
    sellerHandle: row.seller_handle,
    inventoryId: row.inventory_entry_id ?? undefined,
    cardName: row.card_name,
    setName: row.set_name ?? undefined,
    catalogCardId: row.catalog_card_id ?? undefined,
    imageUrl: row.image_url ?? undefined,
    condition: row.condition,
    quantity: row.quantity,
    status: row.status,
    startPriceArs: Math.round(Number(row.start_price_ars)),
    bidIncrementArs: Math.round(Number(row.bid_increment_ars)),
    currentPriceArs: Math.round(Number(row.current_price_ars)),
    buyoutPriceArs: row.buyout_price_ars ? Math.round(Number(row.buyout_price_ars)) : undefined,
    bidCount: row.bid_count ?? 0,
    winnerId: row.winner_id ?? undefined,
    winnerHandle: row.winner_handle ?? undefined,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    offersShipping: Boolean(row.offers_shipping),
    offersPickup: Boolean(row.offers_pickup),
    deliveryAreaNotes: row.delivery_area_notes?.trim() || undefined,
  };
}

function mapAuctionBidRow(row: AuctionBidRow): AuctionBid {
  return {
    id: row.id,
    auctionId: row.auction_id,
    bidderId: row.bidder_id,
    bidderHandle: row.bidder_handle,
    amountArs: Math.round(Number(row.amount_ars)),
    createdAt: row.created_at,
  };
}

function resolveTransactionProviderFromSellerPayment(
  paymentProvider?: SellerPaymentProvider,
): PaymentProvider {
  if (paymentProvider === "mercado_pago") {
    return "mercado_pago";
  }

  return "external_link";
}

function assertSupabaseReady() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Backend not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
}

export async function getSellerPaymentProfile(userId: string): Promise<SellerPaymentProfile> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(PROFILES_TABLE)
    .select(
      "id,username,whatsapp,payment_provider,payment_alias,payment_instructions,updated_at",
    )
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Profile not found.");
  }

  return mapSellerPaymentProfile(data as ProfileRow);
}

export async function updateSellerPaymentProfile(
  input: UpdateSellerPaymentProfileInput,
): Promise<SellerPaymentProfile> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const paymentAlias = input.paymentAlias?.trim() || null;
  const paymentInstructions = input.paymentInstructions?.trim() || null;
  const whatsapp = input.whatsapp?.trim() || null;

  const { data, error } = await client
    .from(PROFILES_TABLE)
    .update({
      whatsapp,
      payment_provider: input.paymentProvider,
      payment_alias: paymentAlias,
      payment_instructions: paymentInstructions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId)
    .select(
      "id,username,whatsapp,payment_provider,payment_alias,payment_instructions,updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update seller payment profile.");
  }

  return mapSellerPaymentProfile(data as ProfileRow);
}

export async function getSocialProfile(userId: string): Promise<SocialProfile> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(PROFILES_TABLE)
    .select(SOCIAL_PROFILE_SELECT)
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Profile not found.");
  }

  const [tradeResult, wantedResult, listingResult, followersResult, followingResult] = await Promise.all([
    client
      .from(INVENTORY_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("available_for_trade", true),
    client
      .from(WATCHES_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("public_wanted", true),
    client
      .from(LISTINGS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("seller_id", userId)
      .in("status", ["active", "pending_payment", "sold"]),
    client
      .from(PROFILE_FOLLOWS_TABLE)
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", userId),
    client
      .from(PROFILE_FOLLOWS_TABLE)
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);

  return mapSocialProfile(data as ProfileRow, {
    tradeCount: tradeResult.count ?? 0,
    wantedCount: wantedResult.count ?? 0,
    listingCount: listingResult.count ?? 0,
    followersCount: followersResult.count ?? 0,
    followingCount: followingResult.count ?? 0,
  });
}

export async function updateSocialProfile(
  input: UpdateSocialProfileInput,
): Promise<SocialProfile> {
  assertSupabaseReady();

  const clean = (value?: string, max = 160) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed.slice(0, max) : null;
  };

  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(PROFILES_TABLE)
    .update({
      display_name: clean(input.displayName, 60),
      bio: clean(input.bio, 360),
      location: clean(input.location, 80),
      avatar_url: clean(input.avatarUrl, 500),
      favorite_game: clean(input.favoriteGame, 60),
      favorite_card: clean(input.favoriteCard, 120),
      instagram: clean(input.instagram, 80),
      discord: clean(input.discord, 80),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId)
    .select(SOCIAL_PROFILE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update social profile.");
  }

  return getSocialProfile(input.userId);
}

export async function checkBackendHealth() {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      message:
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.",
      hint: "Add the Supabase env vars in .env.local (or in your host) and restart.",
    };
  }

  const client = getSupabaseAdminClient();
  const { error } = await client
    .from(INVENTORY_TABLE)
    .select("id,owner_id")
    .limit(1);

  if (error) {
    const message = error.message;
    const lower = message.toLowerCase();
    const missingSchema =
      lower.includes("does not exist") ||
      lower.includes("relation") ||
      lower.includes("column");

    return {
      configured: true,
      connected: false,
      message,
      hint: missingSchema
        ? "Run the pending Supabase migrations, including supabase/migrate-v8.sql, to create the missing tables/columns."
        : "Check that the service role key is valid and the project is reachable.",
    };
  }

  return {
    configured: true,
    connected: true,
    message: "ok",
  };
}

export async function listInventoryEntries(options?: {
  ownerId?: string;
}): Promise<InventoryEntry[]> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  let query = client.from(INVENTORY_TABLE).select("*").order("created_at", {
    ascending: false,
  });

  if (options?.ownerId) {
    query = query.eq("owner_id", options.ownerId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as InventoryRow[]).map(mapInventoryRow);
}

export async function createInventoryEntry(
  input: CreateInventoryInput,
): Promise<InventoryEntry> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(INVENTORY_TABLE)
    .insert({
      owner_id: input.ownerId,
      seller_handle: input.sellerHandle.trim().toLowerCase(),
      card_name: input.cardName.trim(),
      set_name: input.setName?.trim() || null,
      catalog_card_id: input.catalogCardId ?? null,
      image_url: input.imageUrl ?? null,
      condition: input.condition,
      quantity: input.quantity,
      asking_price_ars: input.askingPriceArs ?? null,
      available_for_trade: Boolean(input.availableForTrade),
      trade_notes: input.tradeNotes?.trim() || null,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create inventory entry.");
  }

  return mapInventoryRow(data as InventoryRow);
}

export async function updateInventoryEntry(
  input: UpdateInventoryInput,
): Promise<InventoryEntry> {
  assertSupabaseReady();

  const updates: Record<string, number | string | boolean | null> = {};
  if (typeof input.askingPriceArs === "number") {
    updates.asking_price_ars = Math.max(0, Math.round(input.askingPriceArs));
  }
  if (typeof input.quantity === "number") {
    updates.quantity = Math.max(1, Math.round(input.quantity));
  }
  if (input.imageUrl !== undefined) {
    const trimmed = input.imageUrl?.trim();
    updates.image_url = trimmed && trimmed.length > 0 ? trimmed : null;
  }
  if (typeof input.availableForTrade === "boolean") {
    updates.available_for_trade = input.availableForTrade;
  }
  if (input.tradeNotes !== undefined) {
    const trimmed = input.tradeNotes?.trim();
    updates.trade_notes = trimmed && trimmed.length > 0 ? trimmed : null;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No changes provided.");
  }

  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(INVENTORY_TABLE)
    .update(updates)
    .eq("id", input.entryId)
    .eq("owner_id", input.ownerId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update inventory entry.");
  }

  return mapInventoryRow(data as InventoryRow);
}

export async function deleteInventoryEntry(input: {
  entryId: string;
  ownerId: string;
}): Promise<void> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const { error } = await client
    .from(INVENTORY_TABLE)
    .delete()
    .eq("id", input.entryId)
    .eq("owner_id", input.ownerId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listPublicTradeProfiles(): Promise<TradeProfile[]> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const [inventoryResult, watchesResult] = await Promise.all([
    client
      .from(INVENTORY_TABLE)
      .select("*")
      .eq("available_for_trade", true)
      .order("created_at", { ascending: false })
      .limit(200),
    client
      .from(WATCHES_TABLE)
      .select("*")
      .eq("public_wanted", true)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (inventoryResult.error) throw new Error(inventoryResult.error.message);
  if (watchesResult.error) throw new Error(watchesResult.error.message);

  const tradeCards = ((inventoryResult.data ?? []) as InventoryRow[]).map(mapInventoryRow);
  const wantedCards = ((watchesResult.data ?? []) as WatchRow[]).map(mapWatchRow);
  const userIds = Array.from(
    new Set(
      [
        ...tradeCards.map((card) => card.ownerId),
        ...wantedCards.map((watch) => watch.userId),
      ].filter((id): id is string => Boolean(id)),
    ),
  );

  if (userIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await client
    .from(PROFILES_TABLE)
    .select("id,username")
    .in("id", userIds);

  if (profilesError) throw new Error(profilesError.message);

  const usernames = new Map(
    ((profiles ?? []) as Array<{ id: string; username: string }>).map((profile) => [
      profile.id,
      profile.username,
    ]),
  );

  const grouped = new Map<string, TradeProfile>();
  for (const userId of userIds) {
    grouped.set(userId, {
      userId,
      username: usernames.get(userId) ?? "usuario",
      tradeCards: [],
      wantedCards: [],
    });
  }

  for (const card of tradeCards) {
    if (!card.ownerId) continue;
    grouped.get(card.ownerId)?.tradeCards.push(card);
  }

  for (const watch of wantedCards) {
    grouped.get(watch.userId)?.wantedCards.push({
      ...watch,
      username: usernames.get(watch.userId),
    });
  }

  return Array.from(grouped.values()).filter(
    (profile) => profile.tradeCards.length > 0 || profile.wantedCards.length > 0,
  );
}

export async function listSocialProfiles(options?: {
  query?: string;
  limit?: number;
}): Promise<SocialProfile[]> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const take = Math.min(Math.max(options?.limit ?? 60, 1), 120);
  const { data, error } = await client
    .from(PROFILES_TABLE)
    .select(SOCIAL_PROFILE_SELECT)
    .eq("account_status", "active")
    .order("updated_at", { ascending: false })
    .limit(take);

  if (error) throw new Error(error.message);

  let rows = (data ?? []) as ProfileRow[];

  const userIds = rows.map((row) => row.id);
  if (userIds.length === 0) return [];

  const [tradeResult, wantedResult, listingResult, followersResult, followingResult] = await Promise.all([
    client
      .from(INVENTORY_TABLE)
      .select("owner_id,card_name,set_name,trade_notes")
      .in("owner_id", userIds)
      .eq("available_for_trade", true),
    client
      .from(WATCHES_TABLE)
      .select("user_id,query,notes")
      .in("user_id", userIds)
      .eq("public_wanted", true),
    client
      .from(LISTINGS_TABLE)
      .select("seller_id,card_name,set_name,pack_theme")
      .in("seller_id", userIds)
      .in("status", ["active", "pending_payment", "sold"]),
    client
      .from(PROFILE_FOLLOWS_TABLE)
      .select("following_id")
      .in("following_id", userIds),
    client
      .from(PROFILE_FOLLOWS_TABLE)
      .select("follower_id")
      .in("follower_id", userIds),
  ]);

  if (tradeResult.error) throw new Error(tradeResult.error.message);
  if (wantedResult.error) throw new Error(wantedResult.error.message);
  if (listingResult.error) throw new Error(listingResult.error.message);
  if (followersResult.error) throw new Error(followersResult.error.message);
  if (followingResult.error) throw new Error(followingResult.error.message);

  const tradeRows = (tradeResult.data ?? []) as Array<Record<string, string | null>>;
  const wantedRows = (wantedResult.data ?? []) as Array<Record<string, string | null>>;
  const listingRows = (listingResult.data ?? []) as Array<Record<string, string | null>>;
  const query = options?.query?.trim().toLowerCase();
  if (query) {
    const matchesByUser = new Set<string>();
    for (const row of rows) {
      const text = [
        row.username,
        row.display_name,
        row.bio,
        row.location,
        row.favorite_game,
        row.favorite_card,
      ].join(" ").toLowerCase();
      if (text.includes(query)) matchesByUser.add(row.id);
    }
    for (const item of tradeRows) {
      if ([item.card_name, item.set_name, item.trade_notes].join(" ").toLowerCase().includes(query)) {
        if (item.owner_id) matchesByUser.add(item.owner_id);
      }
    }
    for (const item of wantedRows) {
      if ([item.query, item.notes].join(" ").toLowerCase().includes(query)) {
        if (item.user_id) matchesByUser.add(item.user_id);
      }
    }
    for (const item of listingRows) {
      if ([item.card_name, item.set_name, item.pack_theme].join(" ").toLowerCase().includes(query)) {
        if (item.seller_id) matchesByUser.add(item.seller_id);
      }
    }
    rows = rows.filter((row) => matchesByUser.has(row.id));
  }

  const countBy = (items: Array<Record<string, string | null>>, key: string) => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const id = item[key];
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  };

  const tradeCounts = countBy(tradeRows, "owner_id");
  const wantedCounts = countBy(wantedRows, "user_id");
  const listingCounts = countBy(listingRows, "seller_id");
  const followersCounts = countBy((followersResult.data ?? []) as Array<Record<string, string | null>>, "following_id");
  const followingCounts = countBy((followingResult.data ?? []) as Array<Record<string, string | null>>, "follower_id");

  return rows
    .map((row) =>
      mapSocialProfile(row, {
        tradeCount: tradeCounts.get(row.id) ?? 0,
        wantedCount: wantedCounts.get(row.id) ?? 0,
        listingCount: listingCounts.get(row.id) ?? 0,
        followersCount: followersCounts.get(row.id) ?? 0,
        followingCount: followingCounts.get(row.id) ?? 0,
      }),
    )
    .sort((a, b) => {
      if (b.completionScore !== a.completionScore) {
        return b.completionScore - a.completionScore;
      }
      return b.tradeCount + b.wantedCount + b.listingCount - (a.tradeCount + a.wantedCount + a.listingCount);
    });
}

export async function getPublicProfileByUsername(
  username: string,
  actorUserId?: string,
): Promise<PublicProfileDetail | null> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(PROFILES_TABLE)
    .select(SOCIAL_PROFILE_SELECT)
    .eq("username", username.trim().toLowerCase())
    .eq("account_status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as ProfileRow;
  const [tradeResult, wantedResult, listingResult, followersResult, followingResult, isFollowingResult] = await Promise.all([
    client
      .from(INVENTORY_TABLE)
      .select("*")
      .eq("owner_id", row.id)
      .eq("available_for_trade", true)
      .order("created_at", { ascending: false })
      .limit(24),
    client
      .from(WATCHES_TABLE)
      .select("*")
      .eq("user_id", row.id)
      .eq("public_wanted", true)
      .order("created_at", { ascending: false })
      .limit(24),
    client
      .from(LISTINGS_TABLE)
      .select("*")
      .eq("seller_id", row.id)
      .in("status", ["active", "pending_payment", "sold"])
      .order("created_at", { ascending: false })
      .limit(12),
    client
      .from(PROFILE_FOLLOWS_TABLE)
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", row.id),
    client
      .from(PROFILE_FOLLOWS_TABLE)
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", row.id),
    actorUserId
      ? client
          .from(PROFILE_FOLLOWS_TABLE)
          .select("follower_id")
          .eq("follower_id", actorUserId)
          .eq("following_id", row.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (tradeResult.error) throw new Error(tradeResult.error.message);
  if (wantedResult.error) throw new Error(wantedResult.error.message);
  if (listingResult.error) throw new Error(listingResult.error.message);
  if (followersResult.error) throw new Error(followersResult.error.message);
  if (followingResult.error) throw new Error(followingResult.error.message);
  if (isFollowingResult.error) throw new Error(isFollowingResult.error.message);

  const tradeCards = ((tradeResult.data ?? []) as InventoryRow[]).map(mapInventoryRow);
  const wantedCards = ((wantedResult.data ?? []) as WatchRow[]).map(mapWatchRow);
  const listings = ((listingResult.data ?? []) as ListingRow[]).map(mapListingRow);

  return {
    profile: mapSocialProfile(row, {
      tradeCount: tradeCards.length,
      wantedCount: wantedCards.length,
      listingCount: listings.length,
      followersCount: followersResult.count ?? 0,
      followingCount: followingResult.count ?? 0,
    }),
    tradeCards,
    wantedCards,
    listings,
    isFollowing: Boolean(isFollowingResult.data),
  };
}

export async function setProfileFollow(input: {
  followerId: string;
  followingId: string;
  follow: boolean;
}): Promise<{ following: boolean }> {
  assertSupabaseReady();
  if (input.followerId === input.followingId) {
    throw new Error("No podes seguir tu propio perfil.");
  }

  const client = getSupabaseAdminClient();
  if (!input.follow) {
    const { error } = await client
      .from(PROFILE_FOLLOWS_TABLE)
      .delete()
      .eq("follower_id", input.followerId)
      .eq("following_id", input.followingId);
    if (error) throw new Error(error.message);
    return { following: false };
  }

  const { error } = await client.from(PROFILE_FOLLOWS_TABLE).upsert(
    {
      follower_id: input.followerId,
      following_id: input.followingId,
      created_at: new Date().toISOString(),
    },
    { onConflict: "follower_id,following_id" },
  );
  if (error) throw new Error(error.message);
  return { following: true };
}

export async function createTradeProposal(input: {
  proposerId: string;
  proposerHandle: string;
  recipientId: string;
  recipientHandle: string;
  offeredInventoryIds: string[];
  requestedInventoryIds: string[];
  message?: string;
}): Promise<TradeProposal> {
  assertSupabaseReady();
  if (input.proposerId === input.recipientId) {
    throw new Error("No podes proponerte un trade a vos mismo.");
  }

  const offeredIds = Array.from(new Set(input.offeredInventoryIds)).slice(0, 12);
  const requestedIds = Array.from(new Set(input.requestedInventoryIds)).slice(0, 12);
  if (offeredIds.length === 0 || requestedIds.length === 0) {
    throw new Error("Elegí al menos una carta ofrecida y una carta pedida.");
  }

  const client = getSupabaseAdminClient();
  const [offeredResult, requestedResult] = await Promise.all([
    client
      .from(INVENTORY_TABLE)
      .select("id")
      .eq("owner_id", input.proposerId)
      .in("id", offeredIds),
    client
      .from(INVENTORY_TABLE)
      .select("id")
      .eq("owner_id", input.recipientId)
      .eq("available_for_trade", true)
      .in("id", requestedIds),
  ]);

  if (offeredResult.error) throw new Error(offeredResult.error.message);
  if (requestedResult.error) throw new Error(requestedResult.error.message);
  if ((offeredResult.data ?? []).length !== offeredIds.length) {
    throw new Error("Una o mas cartas ofrecidas no pertenecen a tu inventario.");
  }
  if ((requestedResult.data ?? []).length !== requestedIds.length) {
    throw new Error("Una o mas cartas pedidas ya no estan disponibles para trade.");
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from(TRADE_PROPOSALS_TABLE)
    .insert({
      proposer_id: input.proposerId,
      proposer_handle: input.proposerHandle.trim().toLowerCase(),
      recipient_id: input.recipientId,
      recipient_handle: input.recipientHandle.trim().toLowerCase(),
      offered_inventory_ids: offeredIds,
      requested_inventory_ids: requestedIds,
      message: input.message?.trim() || null,
      status: "pending",
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create trade proposal.");
  return mapTradeProposal(data as TradeProposalRow);
}

export async function listTradeProposalsForUser(userId: string): Promise<TradeProposal[]> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(TRADE_PROPOSALS_TABLE)
    .select("*")
    .or(`proposer_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return ((data ?? []) as TradeProposalRow[]).map(mapTradeProposal);
}

export async function updateTradeProposalStatus(input: {
  userId: string;
  proposalId: string;
  nextStatus: TradeProposalStatus;
}): Promise<TradeProposal> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await client
    .from(TRADE_PROPOSALS_TABLE)
    .select("*")
    .eq("id", input.proposalId)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message ?? "Trade proposal not found.");
  }

  const proposal = existing as TradeProposalRow;
  const isRecipient = proposal.recipient_id === input.userId;
  const isProposer = proposal.proposer_id === input.userId;
  if (!isRecipient && !isProposer) {
    throw new Error("No autorizado para modificar esta propuesta.");
  }
  if (input.nextStatus === "accepted" || input.nextStatus === "declined") {
    if (!isRecipient) throw new Error("Solo el receptor puede aceptar o rechazar.");
  }
  if (input.nextStatus === "cancelled" && !isProposer) {
    throw new Error("Solo quien propuso puede cancelar.");
  }
  if (input.nextStatus === "completed" && proposal.status !== "accepted") {
    throw new Error("Primero ambas partes tienen que aceptar el acuerdo.");
  }
  if (input.nextStatus !== "completed" && proposal.status !== "pending") {
    throw new Error("Esta propuesta ya no esta pendiente.");
  }

  if (input.nextStatus === "completed") {
    const now = new Date().toISOString();
    const nextProposerConfirmedAt = isProposer
      ? now
      : proposal.proposer_confirmed_at ?? null;
    const nextRecipientConfirmedAt = isRecipient
      ? now
      : proposal.recipient_confirmed_at ?? null;
    const bothConfirmed = Boolean(nextProposerConfirmedAt && nextRecipientConfirmedAt);

    if (!bothConfirmed) {
      const { data, error } = await client
        .from(TRADE_PROPOSALS_TABLE)
        .update({
          proposer_confirmed_at: nextProposerConfirmedAt,
          recipient_confirmed_at: nextRecipientConfirmedAt,
          updated_at: now,
        })
        .eq("id", input.proposalId)
        .select("*")
        .single();

      if (error || !data) throw new Error(error?.message ?? "Failed to confirm trade.");
      return mapTradeProposal(data as TradeProposalRow);
    }

    const offeredIds = proposal.offered_inventory_ids ?? [];
    const requestedIds = proposal.requested_inventory_ids ?? [];
    const [offeredResult, requestedResult] = await Promise.all([
      client
        .from(INVENTORY_TABLE)
        .select("id")
        .eq("owner_id", proposal.proposer_id)
        .in("id", offeredIds),
      client
        .from(INVENTORY_TABLE)
        .select("id")
        .eq("owner_id", proposal.recipient_id)
        .eq("available_for_trade", true)
        .in("id", requestedIds),
    ]);

    if (offeredResult.error) throw new Error(offeredResult.error.message);
    if (requestedResult.error) throw new Error(requestedResult.error.message);
    if ((offeredResult.data ?? []).length !== offeredIds.length) {
      throw new Error("Una o mas cartas ofrecidas ya no pertenecen al proponente.");
    }
    if ((requestedResult.data ?? []).length !== requestedIds.length) {
      throw new Error("Una o mas cartas pedidas ya no estan disponibles.");
    }

    if (offeredIds.length > 0) {
      const { error: offeredSwapError } = await client
        .from(INVENTORY_TABLE)
        .update({
          owner_id: proposal.recipient_id,
          seller_handle: proposal.recipient_handle,
          available_for_trade: false,
          trade_notes: null,
        })
        .in("id", offeredIds);
      if (offeredSwapError) throw new Error(offeredSwapError.message);
    }

    if (requestedIds.length > 0) {
      const { error: requestedSwapError } = await client
        .from(INVENTORY_TABLE)
        .update({
          owner_id: proposal.proposer_id,
          seller_handle: proposal.proposer_handle,
          available_for_trade: false,
          trade_notes: null,
        })
        .in("id", requestedIds);
      if (requestedSwapError) throw new Error(requestedSwapError.message);
    }

    const { data, error } = await client
      .from(TRADE_PROPOSALS_TABLE)
      .update({
        status: "completed",
        proposer_confirmed_at: nextProposerConfirmedAt,
        recipient_confirmed_at: nextRecipientConfirmedAt,
        updated_at: now,
      })
      .eq("id", input.proposalId)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to complete trade.");
    return mapTradeProposal(data as TradeProposalRow);
  }

  const { data, error } = await client
    .from(TRADE_PROPOSALS_TABLE)
    .update({ status: input.nextStatus, updated_at: new Date().toISOString() })
    .eq("id", input.proposalId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update trade proposal.");
  return mapTradeProposal(data as TradeProposalRow);
}

export async function listAuctions(options?: {
  sellerId?: string;
  bidderId?: string;
  onlyPublic?: boolean;
  statuses?: AuctionStatus[];
  viewerUserId?: string;
}): Promise<AuctionListing[]> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  let query = client.from(AUCTIONS_TABLE).select("*").order("starts_at", {
    ascending: true,
  });

  if (options?.sellerId) {
    query = query.eq("seller_id", options.sellerId);
  }

  if (options?.statuses && options.statuses.length > 0) {
    query = query.in("status", options.statuses);
  } else if (options?.onlyPublic) {
    query = query.in("status", ["scheduled", "active", "ended", "settled"]);
  }

  if (options?.bidderId) {
    const { data: bids, error: bidsError } = await client
      .from(AUCTION_BIDS_TABLE)
      .select("auction_id")
      .eq("bidder_id", options.bidderId);
    if (bidsError) throw new Error(bidsError.message);
    const ids = Array.from(new Set((bids ?? []).map((row) => (row as { auction_id: string }).auction_id)));
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const auctions = ((data ?? []) as AuctionRow[]).map(mapAuctionRow);

  if (auctions.length === 0) return auctions;
  const ids = auctions.map((auction) => auction.id);
  const [counts, viewerSet] = await Promise.all([
    getAuctionSubscriptionCounts(ids),
    options?.viewerUserId
      ? getUserAuctionSubscriptionSet(options.viewerUserId, ids)
      : Promise.resolve(new Set<string>()),
  ]);
  return auctions.map((auction) => ({
    ...auction,
    subscriberCount: counts[auction.id] ?? 0,
    viewerSubscribed: viewerSet.has(auction.id),
  }));
}

export async function listAuctionBids(auctionId: string): Promise<AuctionBid[]> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(AUCTION_BIDS_TABLE)
    .select("*")
    .eq("auction_id", auctionId)
    .order("amount_ars", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return ((data ?? []) as AuctionBidRow[]).map(mapAuctionBidRow);
}

export async function createAuction(input: CreateAuctionInput): Promise<AuctionListing> {
  assertSupabaseReady();
  assertListingLogisticsValid(input.offersShipping, input.offersPickup, input.deliveryAreaNotes);

  const startPrice = Math.round(input.startPriceArs);
  const increment = Math.round(input.bidIncrementArs);
  const durationHours = Math.min(Math.max(Math.round(input.durationHours), 1), 168);
  if (startPrice <= 0) throw new Error("El precio inicial debe ser mayor a 0.");
  if (increment <= 0) throw new Error("El incremento minimo debe ser mayor a 0.");
  if (input.buyoutPriceArs && input.buyoutPriceArs <= startPrice) {
    throw new Error("El precio de compra directa debe superar el precio inicial.");
  }

  const client = getSupabaseAdminClient();
  const { data: inventory, error: inventoryError } = await client
    .from(INVENTORY_TABLE)
    .select("id,owner_id,quantity")
    .eq("id", input.inventoryId)
    .eq("owner_id", input.sellerId)
    .single();

  if (inventoryError || !inventory) {
    throw new Error(inventoryError?.message ?? "La carta no pertenece a tu inventario.");
  }

  const inv = inventory as { quantity: number };
  if (input.quantity <= 0 || input.quantity > inv.quantity) {
    throw new Error("Cantidad invalida para subastar.");
  }

  const now = new Date();
  let startsAt = now;
  let status: AuctionStatus = "active";
  if (input.scheduledStartAt) {
    const scheduled = new Date(input.scheduledStartAt);
    if (Number.isNaN(scheduled.getTime())) {
      throw new Error("Fecha de inicio invalida.");
    }
    if (scheduled.getTime() <= now.getTime() + 5 * 60_000) {
      throw new Error("La subasta debe arrancar al menos 5 minutos en el futuro.");
    }
    startsAt = scheduled;
    status = "scheduled";
  }
  const endsAt = new Date(startsAt.getTime() + durationHours * 3_600_000);
  const { data, error } = await client
    .from(AUCTIONS_TABLE)
    .insert({
      seller_id: input.sellerId,
      seller_handle: input.sellerHandle.trim().toLowerCase(),
      inventory_entry_id: input.inventoryId,
      card_name: input.cardName.trim(),
      set_name: input.setName?.trim() || null,
      catalog_card_id: input.catalogCardId ?? null,
      image_url: input.imageUrl ?? null,
      condition: input.condition,
      quantity: input.quantity,
      status,
      start_price_ars: startPrice,
      bid_increment_ars: increment,
      current_price_ars: startPrice,
      buyout_price_ars: input.buyoutPriceArs ? Math.round(input.buyoutPriceArs) : null,
      bid_count: 0,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      offers_shipping: input.offersShipping,
      offers_pickup: input.offersPickup,
      delivery_area_notes: input.deliveryAreaNotes.trim(),
      created_at: now.toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create auction.");
  return mapAuctionRow(data as AuctionRow);
}

export async function subscribeToAuction(input: {
  auctionId: string;
  userId: string;
}): Promise<void> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { error } = await client
    .from(AUCTION_SUBSCRIPTIONS_TABLE)
    .upsert(
      { auction_id: input.auctionId, user_id: input.userId },
      { onConflict: "auction_id,user_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}

export async function unsubscribeFromAuction(input: {
  auctionId: string;
  userId: string;
}): Promise<void> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { error } = await client
    .from(AUCTION_SUBSCRIPTIONS_TABLE)
    .delete()
    .eq("auction_id", input.auctionId)
    .eq("user_id", input.userId);
  if (error) throw new Error(error.message);
}

export async function getAuctionSubscriptionCounts(
  auctionIds: string[],
): Promise<Record<string, number>> {
  if (auctionIds.length === 0) return {};
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(AUCTION_SUBSCRIPTIONS_TABLE)
    .select("auction_id")
    .in("auction_id", auctionIds);
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ auction_id: string }>) {
    counts[row.auction_id] = (counts[row.auction_id] ?? 0) + 1;
  }
  return counts;
}

export async function getUserAuctionSubscriptionSet(
  userId: string,
  auctionIds: string[],
): Promise<Set<string>> {
  if (auctionIds.length === 0) return new Set();
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(AUCTION_SUBSCRIPTIONS_TABLE)
    .select("auction_id")
    .eq("user_id", userId)
    .in("auction_id", auctionIds);
  if (error) throw new Error(error.message);
  return new Set(((data ?? []) as Array<{ auction_id: string }>).map((row) => row.auction_id));
}

export async function getAuctionById(auctionId: string): Promise<AuctionListing | null> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(AUCTIONS_TABLE)
    .select("*")
    .eq("id", auctionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapAuctionRow(data as AuctionRow);
}

/**
 * Pasa subastas programadas a "active" si ya llegó su starts_at.
 * Crea notificaciones in-app para los suscriptos.
 * Retorna la cantidad activada.
 */
export async function activateScheduledAuctions(now: Date = new Date()): Promise<number> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  const { data: due, error: dueError } = await client
    .from(AUCTIONS_TABLE)
    .select("id,card_name,seller_handle")
    .eq("status", "scheduled")
    .lte("starts_at", now.toISOString())
    .limit(50);

  if (dueError) throw new Error(dueError.message);
  const rows = (due ?? []) as Array<{ id: string; card_name: string; seller_handle: string }>;
  if (rows.length === 0) return 0;

  const ids = rows.map((row) => row.id);
  const { error: updateError } = await client
    .from(AUCTIONS_TABLE)
    .update({ status: "active" })
    .in("id", ids);
  if (updateError) throw new Error(updateError.message);

  const { data: subs, error: subsError } = await client
    .from(AUCTION_SUBSCRIPTIONS_TABLE)
    .select("id,auction_id,user_id")
    .in("auction_id", ids);
  if (subsError) throw new Error(subsError.message);

  const subRows = (subs ?? []) as Array<{ id: string; auction_id: string; user_id: string }>;
  if (subRows.length > 0) {
    const auctionsById = new Map(rows.map((row) => [row.id, row]));
    const notifications = subRows.map((sub) => {
      const auction = auctionsById.get(sub.auction_id);
      return {
        user_id: sub.user_id,
        type: "system" as const,
        title: "Empezó una subasta que seguías",
        body: auction
          ? `La subasta de ${auction.card_name} (@${auction.seller_handle}) acaba de arrancar.`
          : "Una subasta que seguías acaba de arrancar.",
        link_path: `/auctions/${sub.auction_id}`,
      };
    });
    await client.from(NOTIFICATIONS_TABLE).insert(notifications);
    await client
      .from(AUCTION_SUBSCRIPTIONS_TABLE)
      .update({ notified_at: now.toISOString() })
      .in(
        "id",
        subRows.map((row) => row.id),
      );
  }

  return rows.length;
}

export async function placeAuctionBid(input: {
  auctionId: string;
  bidderId: string;
  bidderHandle: string;
  amountArs: number;
}): Promise<{ auction: AuctionListing; bid: AuctionBid }> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await client
    .from(AUCTIONS_TABLE)
    .select("*")
    .eq("id", input.auctionId)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message ?? "Subasta no encontrada.");
  }

  const auction = existing as AuctionRow;
  if (auction.status === "scheduled") {
    throw new Error("La subasta todavia no empezo.");
  }
  if (auction.status !== "active") throw new Error("La subasta no esta activa.");
  if (auction.seller_id === input.bidderId) throw new Error("No podes ofertar en tu propia subasta.");
  if (new Date(auction.starts_at).getTime() > Date.now()) {
    throw new Error("La subasta todavia no empezo.");
  }
  if (new Date(auction.ends_at).getTime() <= Date.now()) {
    await closeAuction({ auctionId: auction.id, actorUserId: auction.seller_id ?? input.bidderId });
    throw new Error("La subasta ya termino.");
  }

  const amount = Math.round(input.amountArs);
  const minBid = Math.round(Number(auction.current_price_ars)) + Math.round(Number(auction.bid_increment_ars));
  if (amount < minBid) {
    throw new Error(`La oferta minima es ARS ${minBid.toLocaleString("es-AR")}.`);
  }

  const buyout = auction.buyout_price_ars ? Math.round(Number(auction.buyout_price_ars)) : null;
  const nextStatus: AuctionStatus = buyout && amount >= buyout ? "ended" : "active";
  const { data: bidData, error: bidError } = await client
    .from(AUCTION_BIDS_TABLE)
    .insert({
      auction_id: auction.id,
      bidder_id: input.bidderId,
      bidder_handle: input.bidderHandle.trim().toLowerCase(),
      amount_ars: amount,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (bidError || !bidData) throw new Error(bidError?.message ?? "No se pudo ofertar.");

  const { data: updated, error: updateError } = await client
    .from(AUCTIONS_TABLE)
    .update({
      current_price_ars: amount,
      bid_count: (auction.bid_count ?? 0) + 1,
      winner_id: input.bidderId,
      winner_handle: input.bidderHandle.trim().toLowerCase(),
      status: nextStatus,
    })
    .eq("id", auction.id)
    .select("*")
    .single();

  if (updateError || !updated) throw new Error(updateError?.message ?? "No se pudo actualizar la subasta.");
  return {
    auction: mapAuctionRow(updated as AuctionRow),
    bid: mapAuctionBidRow(bidData as AuctionBidRow),
  };
}

export async function closeAuction(input: {
  auctionId: string;
  actorUserId: string;
}): Promise<AuctionListing> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await client
    .from(AUCTIONS_TABLE)
    .select("*")
    .eq("id", input.auctionId)
    .single();

  if (existingError || !existing) throw new Error(existingError?.message ?? "Subasta no encontrada.");
  const auction = existing as AuctionRow;
  const isSeller = auction.seller_id === input.actorUserId;
  const endedByTime = new Date(auction.ends_at).getTime() <= Date.now();
  if (!isSeller && !endedByTime) {
    throw new Error("Solo el vendedor puede cerrar una subasta antes del cierre automatico.");
  }

  const nextStatus: AuctionStatus = auction.winner_id ? "ended" : "cancelled";
  const { data, error } = await client
    .from(AUCTIONS_TABLE)
    .update({ status: nextStatus })
    .eq("id", input.auctionId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "No se pudo cerrar la subasta.");
  const closed = data as AuctionRow;

  // If there's a winner, create a pending transaction and notify both parties.
  if (closed.winner_id && closed.winner_handle && nextStatus === "ended") {
    const sellerProfile = closed.seller_id
      ? await client
          .from(PROFILES_TABLE)
          .select("payment_provider,payment_alias,payment_instructions")
          .eq("id", closed.seller_id)
          .maybeSingle()
          .then((res) => res.data as { payment_provider: SellerPaymentProvider | null } | null)
      : null;

    const provider = resolveTransactionProviderFromSellerPayment(
      sellerProfile?.payment_provider ?? undefined,
    );
    const transactionId = `tx_auction_${Date.now()}`;
    const now = new Date().toISOString();

    await client.from(PAYMENTS_TABLE).insert({
      transaction_id: transactionId,
      listing_id: null,
      auction_id: closed.id,
      seller_id: closed.seller_id,
      seller_handle: closed.seller_handle,
      buyer_id: closed.winner_id,
      buyer_handle: closed.winner_handle,
      provider,
      provider_payment_id: null,
      provider_status: "pending",
      verification_status: "pending_review",
      fulfillment_status: "pending",
      shipping_tracking: null,
      checked_at: now,
      created_at: now,
    });

    const winnerAmount = `ARS ${Math.round(Number(closed.current_price_ars)).toLocaleString("es-AR")}`;
    const notifications = [
      {
        user_id: closed.winner_id,
        type: "transaction_update" as const,
        title: "¡Ganaste la subasta!",
        body: `Ganaste ${closed.card_name} por ${winnerAmount}. Coordiná el pago con @${closed.seller_handle}.`,
        link_path: `/transactions`,
      },
    ];
    if (closed.seller_id) {
      notifications.push({
        user_id: closed.seller_id,
        type: "transaction_update" as const,
        title: "Subasta terminada",
        body: `Tu subasta de ${closed.card_name} fue ganada por @${closed.winner_handle} (${winnerAmount}).`,
        link_path: `/transactions`,
      });
    }
    await client.from(NOTIFICATIONS_TABLE).insert(notifications);
  }

  return mapAuctionRow(closed);
}

export async function listListings(options?: {
  statuses?: ListingStatus[];
  sellerId?: string;
  onlyPublic?: boolean;
}): Promise<Listing[]> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  let query = client.from(LISTINGS_TABLE).select("*").order("created_at", {
    ascending: false,
  });

  if (options?.statuses && options.statuses.length > 0) {
    query = query.in("status", options.statuses);
  }

  if (options?.sellerId) {
    query = query.eq("seller_id", options.sellerId);
  }

  if (options?.onlyPublic) {
    query = query.in("status", ["active", "pending_payment", "sold"]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const listings = ((data ?? []) as ListingRow[]).map(mapListingRow);
  return enrichListingsWithMpStatus(listings);
}

async function enrichListingsWithMpStatus(listings: Listing[]): Promise<Listing[]> {
  if (listings.length === 0) return listings;
  const sellerIds = Array.from(
    new Set(listings.map((listing) => listing.sellerId).filter((id): id is string => Boolean(id))),
  );
  if (sellerIds.length === 0) return listings;

  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(PROFILES_TABLE)
    .select("id,mp_connected")
    .in("id", sellerIds);
  if (error) return listings;

  const map = new Map(
    ((data ?? []) as Array<{ id: string; mp_connected: boolean | null }>).map((row) => [
      row.id,
      Boolean(row.mp_connected),
    ]),
  );
  return listings.map((listing) =>
    listing.sellerId
      ? { ...listing, sellerMpConnected: map.get(listing.sellerId) ?? false }
      : listing,
  );
}

export async function createListing(input: CreateListingInput): Promise<Listing> {
  assertSupabaseReady();

  assertListingLogisticsValid(
    input.offersShipping,
    input.offersPickup,
    input.deliveryAreaNotes,
  );

  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(LISTINGS_TABLE)
    .insert({
      seller_id: input.sellerId,
      seller_handle: input.sellerHandle.trim().toLowerCase(),
      inventory_entry_id: input.inventoryId ?? null,
      card_name: input.cardName.trim(),
      set_name: input.setName.trim(),
      catalog_card_id: input.catalogCardId ?? null,
      image_url: input.imageUrl ?? null,
      condition: input.condition,
      price_ars: Math.round(input.priceArs),
      quantity: input.quantity,
      status: "active",
      listing_type: input.listingType ?? "single",
      pack_card_count: input.packCardCount ?? null,
      pack_rarity_floor: input.packRarityFloor ?? null,
      pack_theme: input.packTheme ?? null,
      pack_description: input.packDescription ?? null,
      offers_shipping: input.offersShipping,
      offers_pickup: input.offersPickup,
      delivery_area_notes: input.deliveryAreaNotes.trim(),
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create listing.");
  }

  const listing = mapListingRow(data as ListingRow);

  try {
    await fanoutListingToWatchers(listing);
  } catch (err) {
    console.warn("fanoutListingToWatchers failed", err);
  }

  return listing;
}

export async function cancelListing(input: CancelListingInput): Promise<Listing> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(LISTINGS_TABLE)
    .update({ status: "cancelled", reserved_at: null })
    .eq("id", input.listingId)
    .eq("seller_id", input.sellerId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to cancel listing.");
  }

  return mapListingRow(data as ListingRow);
}

export async function updateListing(input: UpdateListingInput): Promise<Listing> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const updates: Record<string, number | string | null | boolean> = {};
  if (typeof input.priceArs === "number" && Number.isFinite(input.priceArs)) {
    if (input.priceArs <= 0) {
      throw new Error("priceArs must be greater than 0.");
    }
    updates.price_ars = Math.round(input.priceArs);
  }
  if (typeof input.quantity === "number" && Number.isFinite(input.quantity)) {
    const q = Math.max(1, Math.round(input.quantity));
    if (q > 100) {
      throw new Error("quantity must be at most 100.");
    }
    updates.quantity = q;
  }
  if (input.imageUrl !== undefined) {
    const trimmed = input.imageUrl?.trim();
    updates.image_url = trimmed && trimmed.length > 0 ? trimmed : null;
  }
  if (typeof input.offersShipping === "boolean") {
    updates.offers_shipping = input.offersShipping;
  }
  if (typeof input.offersPickup === "boolean") {
    updates.offers_pickup = input.offersPickup;
  }
  if (input.deliveryAreaNotes !== undefined) {
    const t = input.deliveryAreaNotes?.trim() ?? "";
    updates.delivery_area_notes = t.length > 0 ? t : null;
  }

  const touchesLogistics =
    typeof input.offersShipping === "boolean" ||
    typeof input.offersPickup === "boolean" ||
    input.deliveryAreaNotes !== undefined;

  if (touchesLogistics) {
    const { data: cur, error: curError } = await client
      .from(LISTINGS_TABLE)
      .select("offers_shipping, offers_pickup, delivery_area_notes")
      .eq("id", input.listingId)
      .eq("seller_id", input.sellerId)
      .maybeSingle();

    if (curError || !cur) {
      throw new Error(curError?.message ?? "Listing not found.");
    }
    const row = cur as {
      offers_shipping: boolean | null;
      offers_pickup: boolean | null;
      delivery_area_notes: string | null;
    };
    const nextShip =
      typeof input.offersShipping === "boolean"
        ? input.offersShipping
        : Boolean(row.offers_shipping);
    const nextPick =
      typeof input.offersPickup === "boolean" ? input.offersPickup : Boolean(row.offers_pickup);
    const nextNotes =
      input.deliveryAreaNotes !== undefined
        ? (input.deliveryAreaNotes?.trim() ?? "")
        : (row.delivery_area_notes ?? "");
    assertListingLogisticsValid(nextShip, nextPick, nextNotes);
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No changes provided.");
  }

  const { data, error } = await client
    .from(LISTINGS_TABLE)
    .update(updates)
    .eq("id", input.listingId)
    .eq("seller_id", input.sellerId)
    .eq("status", "active")
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update listing.");
  }

  return mapListingRow(data as ListingRow);
}

export async function releaseStalePendingListings(maxAgeHours = 24): Promise<number> {
  assertSupabaseReady();

  const cutoff = new Date(Date.now() - maxAgeHours * 3_600_000).toISOString();
  const client = getSupabaseAdminClient();

  const { data, error } = await client
    .from(LISTINGS_TABLE)
    .update({ status: "active", reserved_at: null })
    .eq("status", "pending_payment")
    .not("reserved_at", "is", null)
    .lt("reserved_at", cutoff)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  return data?.length ?? 0;
}

export async function reserveListing(input: ReserveListingInput): Promise<{
  listing: Listing;
  transactionId: string;
  sellerPayment: SellerPaymentDetails;
}> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const listingId = input.listingId.trim();

  const { data: listingCheck, error: listingCheckError } = await client
    .from(LISTINGS_TABLE)
    .select("id,seller_id,seller_handle")
    .eq("id", listingId)
    .single();

  if (listingCheckError || !listingCheck) {
    throw new Error("Listing is not available.");
  }

  const listingOwner = listingCheck as {
    seller_id: string | null;
    seller_handle: string;
  };

  if (listingOwner.seller_id === input.buyerId) {
    throw new Error("You cannot reserve your own listing.");
  }

  const reservedAt = new Date().toISOString();
  const { data: activeListing, error: activeError } = await client
    .from(LISTINGS_TABLE)
    .update({ status: "pending_payment", reserved_at: reservedAt })
    .eq("id", listingId)
    .eq("status", "active")
    .select("*")
    .single();

  if (activeError || !activeListing) {
    throw new Error("Listing is not available.");
  }

  let sellerPayment: SellerPaymentDetails = {
    sellerId: listingOwner.seller_id ?? undefined,
    sellerHandle: listingOwner.seller_handle,
  };

  if (listingOwner.seller_id) {
    const { data: sellerProfile, error: sellerProfileError } = await client
      .from(PROFILES_TABLE)
      .select(
        "id,username,whatsapp,payment_provider,payment_alias,payment_instructions,updated_at",
      )
      .eq("id", listingOwner.seller_id)
      .maybeSingle();

    if (!sellerProfileError && sellerProfile) {
      sellerPayment = mapSellerPaymentDetails(sellerProfile as ProfileRow);
    }
  }

  const transactionProvider = resolveTransactionProviderFromSellerPayment(
    sellerPayment.paymentProvider,
  );
  const transactionId = `tx_${Date.now()}`;
  const now = new Date().toISOString();

  const { error: paymentError } = await client.from(PAYMENTS_TABLE).insert({
    transaction_id: transactionId,
    listing_id: listingId,
    buyer_id: input.buyerId,
    buyer_handle: input.buyerHandle.trim().toLowerCase(),
    provider: transactionProvider,
    provider_payment_id: null,
    provider_status: "pending",
    verification_status: "pending_review",
    fulfillment_status: "pending",
    shipping_tracking: null,
    checked_at: now,
    created_at: now,
  });

  if (paymentError) {
    await client
      .from(LISTINGS_TABLE)
      .update({ status: "active", reserved_at: null })
      .eq("id", listingId)
      .eq("status", "pending_payment");
    throw new Error(paymentError.message);
  }

  return {
    listing: mapListingRow(activeListing as ListingRow),
    transactionId,
    sellerPayment,
  };
}

export async function releasePendingCheckoutReservation(input: {
  listingId: string;
  transactionId: string;
}): Promise<void> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  await client
    .from(PAYMENTS_TABLE)
    .delete()
    .eq("transaction_id", input.transactionId)
    .eq("listing_id", input.listingId)
    .eq("provider_status", "pending")
    .eq("verification_status", "pending_review");

  const { error } = await client
    .from(LISTINGS_TABLE)
    .update({ status: "active", reserved_at: null })
    .eq("id", input.listingId)
    .eq("status", "pending_payment");

  if (error) throw new Error(error.message);
}

export async function verifyTransaction(input: VerifyTransactionInput): Promise<{
  payment: PaymentEvent;
  requiresManualCheck: boolean;
}> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const normalizedStatus = input.providerStatus.trim().toLowerCase();
  const verificationStatus: PaymentVerificationStatus =
    input.provider === "external_link"
      ? "pending_review"
      : SUCCESS_PROVIDER_STATUSES.has(normalizedStatus)
        ? "verified"
        : "pending_review";

  const { data: existingPayment, error: existingPaymentError } = await client
    .from(PAYMENTS_TABLE)
    .select("*")
    .eq("transaction_id", input.transactionId)
    .single();

  if (existingPaymentError || !existingPayment) {
    throw new Error(existingPaymentError?.message ?? "Transaction not found.");
  }

  const paymentOwner = (existingPayment as PaymentRow).buyer_id;
  if (!input.bypassOwnership && input.actorUserId && paymentOwner !== input.actorUserId) {
    throw new Error("You are not allowed to verify this transaction.");
  }

  const { data: paymentData, error: paymentError } = await client
    .from(PAYMENTS_TABLE)
    .update({
      provider: input.provider,
      provider_payment_id: input.providerPaymentId,
      provider_status: normalizedStatus,
      verification_status: verificationStatus,
      fulfillment_status: verificationStatus === "verified" ? "seller_confirmed" : "pending",
      checked_at: new Date().toISOString(),
    })
    .eq("transaction_id", input.transactionId)
    .select("*")
    .single();

  if (paymentError || !paymentData) {
    throw new Error(paymentError?.message ?? "Transaction not found.");
  }

  const payment = mapPaymentRow(paymentData as PaymentRow);

  if (payment.verificationStatus === "verified") {
    const { error: listingError } = await client
      .from(LISTINGS_TABLE)
      .update({ status: "sold", reserved_at: null })
      .eq("id", payment.listingId);

    if (listingError) {
      throw new Error(listingError.message);
    }
  }

  return {
    payment,
    requiresManualCheck:
      payment.verificationStatus !== "verified" || input.provider === "external_link",
  };
}

export async function getTransactionProvider(transactionId: string): Promise<PaymentProvider> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(PAYMENTS_TABLE)
    .select("provider")
    .eq("transaction_id", transactionId.trim())
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Transaction not found.");
  }

  return ((data as { provider: PaymentProvider | null }).provider ?? "external_link");
}

export async function listTransactionsForUser(userId: string): Promise<PaymentEventWithListing[]> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const { data: byBuyer, error: byBuyerError } = await client
    .from(PAYMENTS_TABLE)
    .select("*")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  if (byBuyerError) {
    throw new Error(byBuyerError.message);
  }

  // Seller-side: fetch by seller_id column (covers both listing and auction transactions)
  const { data: sellerPayments, error: sellerPaymentsError } = await client
    .from(PAYMENTS_TABLE)
    .select("*")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  if (sellerPaymentsError) throw new Error(sellerPaymentsError.message);
  let bySeller: PaymentRow[] = (sellerPayments ?? []) as PaymentRow[];

  // Legacy fallback: also pick up old rows where seller_id wasn't backfilled
  const { data: sellerListings } = await client
    .from(LISTINGS_TABLE)
    .select("id")
    .eq("seller_id", userId);

  const legacyListingIds = (sellerListings ?? [])
    .map((row) => (row as { id: string }).id)
    .filter((id) => !bySeller.some((p) => p.listing_id === id));

  if (legacyListingIds.length > 0) {
    const { data: legacyPayments } = await client
      .from(PAYMENTS_TABLE)
      .select("*")
      .in("listing_id", legacyListingIds)
      .order("created_at", { ascending: false });
    bySeller = [...bySeller, ...((legacyPayments ?? []) as PaymentRow[])];
  }

  const merged = new Map<string, PaymentRow>();
  for (const row of [...(byBuyer ?? []), ...bySeller] as PaymentRow[]) {
    merged.set(row.id, row);
  }

  const payments = Array.from(merged.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(mapPaymentRow);

  type ListingMeta = {
    cardName: string;
    setName: string;
    sellerHandle: string;
    offersShipping: boolean;
    offersPickup: boolean;
    deliveryAreaNotes?: string;
  };

  const byListingId = new Map<string, ListingMeta>();
  const byAuctionId = new Map<string, ListingMeta>();

  const lids = [...new Set(payments.map((p) => p.listingId).filter(Boolean))];
  if (lids.length > 0) {
    const { data: listingRows } = await client
      .from(LISTINGS_TABLE)
      .select("id, card_name, set_name, seller_handle, offers_shipping, offers_pickup, delivery_area_notes")
      .in("id", lids);
    for (const raw of listingRows ?? []) {
      const row = raw as { id: string; card_name: string; set_name: string; seller_handle: string; offers_shipping?: boolean | null; offers_pickup?: boolean | null; delivery_area_notes?: string | null };
      byListingId.set(row.id, {
        cardName: row.card_name,
        setName: row.set_name,
        sellerHandle: row.seller_handle,
        offersShipping: Boolean(row.offers_shipping),
        offersPickup: Boolean(row.offers_pickup),
        deliveryAreaNotes: row.delivery_area_notes?.trim() || undefined,
      });
    }
  }

  const aids = [...new Set(payments.map((p) => p.auctionId).filter((id): id is string => Boolean(id)))];
  if (aids.length > 0) {
    const { data: auctionRows } = await client
      .from(AUCTIONS_TABLE)
      .select("id, card_name, set_name, seller_handle, offers_shipping, offers_pickup, delivery_area_notes")
      .in("id", aids);
    for (const raw of auctionRows ?? []) {
      const row = raw as { id: string; card_name: string; set_name: string | null; seller_handle: string; offers_shipping?: boolean | null; offers_pickup?: boolean | null; delivery_area_notes?: string | null };
      byAuctionId.set(row.id, {
        cardName: row.card_name,
        setName: row.set_name ?? "",
        sellerHandle: row.seller_handle,
        offersShipping: Boolean(row.offers_shipping),
        offersPickup: Boolean(row.offers_pickup),
        deliveryAreaNotes: row.delivery_area_notes?.trim() || undefined,
      });
    }
  }

  return payments.map((p) => {
    const meta = (p.auctionId ? byAuctionId.get(p.auctionId) : undefined) ?? byListingId.get(p.listingId);
    return {
      ...p,
      listingCardName: meta?.cardName,
      listingSetName: meta?.setName,
      listingSellerHandle: meta?.sellerHandle ?? p.sellerHandle,
      offersShipping: meta?.offersShipping,
      offersPickup: meta?.offersPickup,
      deliveryAreaNotes: meta?.deliveryAreaNotes,
    };
  });
}

export async function updateFulfillmentStatus(
  input: UpdateFulfillmentInput,
): Promise<PaymentEvent> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();

  const { data: paymentData, error: paymentError } = await client
    .from(PAYMENTS_TABLE)
    .select("*")
    .eq("transaction_id", input.transactionId)
    .single();

  if (paymentError || !paymentData) {
    throw new Error(paymentError?.message ?? "Transaction not found.");
  }

  const payment = paymentData as PaymentRow;
  const isBuyer = payment.buyer_id === input.actorUserId;

  const { data: listing, error: listingError } = await client
    .from(LISTINGS_TABLE)
    .select("seller_id")
    .eq("id", payment.listing_id)
    .single();

  if (listingError || !listing) {
    throw new Error(listingError?.message ?? "Listing not found.");
  }

  const isSeller = (listing as { seller_id: string | null }).seller_id === input.actorUserId;
  if (!isBuyer && !isSeller) {
    throw new Error("Not allowed to update this transaction.");
  }

  if (input.nextStatus === "shipped" && !isSeller) {
    throw new Error("Only seller can set shipped status.");
  }

  if (input.nextStatus === "delivered" && !isBuyer) {
    throw new Error("Only buyer can confirm delivery.");
  }

  const { data: updated, error: updateError } = await client
    .from(PAYMENTS_TABLE)
    .update({
      fulfillment_status: input.nextStatus,
      shipping_tracking: input.trackingNumber ?? payment.shipping_tracking,
      checked_at: new Date().toISOString(),
    })
    .eq("transaction_id", input.transactionId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to update fulfillment status.");
  }

  return mapPaymentRow(updated as PaymentRow);
}

export async function createDispute(input: CreateDisputeInput): Promise<DisputeEvent> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const { data: paymentData, error: paymentError } = await client
    .from(PAYMENTS_TABLE)
    .select("buyer_id,listing_id")
    .eq("transaction_id", input.transactionId)
    .single();

  if (paymentError || !paymentData) {
    throw new Error(paymentError?.message ?? "Transaction not found.");
  }

  const { data: listing, error: listingError } = await client
    .from(LISTINGS_TABLE)
    .select("seller_id")
    .eq("id", (paymentData as { listing_id: string }).listing_id)
    .single();

  if (listingError || !listing) {
    throw new Error(listingError?.message ?? "Listing not found.");
  }

  const buyerId = (paymentData as { buyer_id: string | null }).buyer_id;
  const sellerId = (listing as { seller_id: string | null }).seller_id;
  if (input.openedById !== buyerId && input.openedById !== sellerId) {
    throw new Error("Only buyer or seller can open a dispute.");
  }

  const { data, error } = await client
    .from(DISPUTES_TABLE)
    .insert({
      transaction_id: input.transactionId,
      opened_by_id: input.openedById,
      opened_by_handle: input.openedByHandle,
      reason: input.reason,
      details: input.details,
      status: "open",
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create dispute.");
  }

  await client
    .from(PAYMENTS_TABLE)
    .update({ fulfillment_status: "disputed" })
    .eq("transaction_id", input.transactionId);

  return mapDisputeRow(data as DisputeRow);
}

export async function listDisputesForUser(userId: string): Promise<DisputeEvent[]> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const { data: buyerPayments, error: paymentError } = await client
    .from(PAYMENTS_TABLE)
    .select("transaction_id,buyer_id,listing_id")
    .eq("buyer_id", userId);

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  const { data: sellerListings, error: sellerListingsError } = await client
    .from(LISTINGS_TABLE)
    .select("id")
    .eq("seller_id", userId);

  if (sellerListingsError) {
    throw new Error(sellerListingsError.message);
  }

  const sellerListingIds = (sellerListings ?? []).map((row) => (row as { id: string }).id);
  let sellerPayments: Array<{ transaction_id: string }> = [];

  if (sellerListingIds.length > 0) {
    const { data: sellerPaymentsData, error: sellerPaymentsError } = await client
      .from(PAYMENTS_TABLE)
      .select("transaction_id")
      .in("listing_id", sellerListingIds);

    if (sellerPaymentsError) {
      throw new Error(sellerPaymentsError.message);
    }

    sellerPayments = (sellerPaymentsData ?? []) as Array<{ transaction_id: string }>;
  }

  const transactionIdsFromBuyer = (buyerPayments ?? []).map(
    (row) => (row as { transaction_id: string }).transaction_id,
  );

  const transactionIdsFromSeller = sellerPayments.map((row) => row.transaction_id);

  const transactionIds = Array.from(new Set([...transactionIdsFromBuyer, ...transactionIdsFromSeller]));

  if (transactionIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from(DISPUTES_TABLE)
    .select("*")
    .in("transaction_id", transactionIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DisputeRow[]).map(mapDisputeRow);
}

// ---------------------------------------------------------------------
// Watchlist + notifications
// ---------------------------------------------------------------------

type CreateWatchInput = {
  userId: string;
  query: string;
  maxPriceArs?: number;
  publicWanted?: boolean;
  notes?: string;
};

export async function listWatchesForUser(userId: string): Promise<CardWatch[]> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(WATCHES_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as WatchRow[]).map(mapWatchRow);
}

export async function createWatch(input: CreateWatchInput): Promise<CardWatch> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const normalizedQuery = input.query.trim().toLowerCase();
  if (normalizedQuery.length < 2) {
    throw new Error("query must have at least 2 characters.");
  }

  const { data, error } = await client
    .from(WATCHES_TABLE)
    .upsert(
      {
        user_id: input.userId,
        query: normalizedQuery,
        max_price_ars: input.maxPriceArs ?? null,
        public_wanted: Boolean(input.publicWanted),
        notes: input.notes?.trim() || null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,query" },
    )
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create watch.");
  return mapWatchRow(data as WatchRow);
}

export async function deleteWatch(input: {
  userId: string;
  watchId: string;
}): Promise<void> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { error } = await client
    .from(WATCHES_TABLE)
    .delete()
    .eq("id", input.watchId)
    .eq("user_id", input.userId);
  if (error) throw new Error(error.message);
}

export async function listNotificationsForUser(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<Notification[]> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const take = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  let query = client
    .from(NOTIFICATIONS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(take);

  if (options?.unreadOnly) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
}

export async function markNotificationsRead(input: {
  userId: string;
  ids?: string[];
}): Promise<number> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const now = new Date().toISOString();
  let query = client
    .from(NOTIFICATIONS_TABLE)
    .update({ read_at: now }, { count: "exact" })
    .eq("user_id", input.userId)
    .is("read_at", null);

  if (input.ids && input.ids.length > 0) {
    query = query.in("id", input.ids);
  }

  const { error, count } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function assertUserIsTransactionParty(
  client: ReturnType<typeof getSupabaseAdminClient>,
  transactionId: string,
  userId: string,
): Promise<void> {
  const { data: payment, error } = await client
    .from(PAYMENTS_TABLE)
    .select("buyer_id, listing_id")
    .eq("transaction_id", transactionId.trim())
    .maybeSingle();

  if (error || !payment) {
    throw new Error("Transaction not found.");
  }

  const row = payment as { buyer_id: string | null; listing_id: string };
  if (row.buyer_id === userId) {
    return;
  }

  const { data: listing, error: listingError } = await client
    .from(LISTINGS_TABLE)
    .select("seller_id")
    .eq("id", row.listing_id)
    .maybeSingle();

  if (listingError || !listing) {
    throw new Error("Listing not found.");
  }

  const sellerId = (listing as { seller_id: string | null }).seller_id;
  if (sellerId === userId) {
    return;
  }

  throw new Error("Not allowed to access this conversation.");
}

export async function listTransactionChatMessages(input: {
  transactionId: string;
  actorUserId: string;
}): Promise<TransactionChatMessage[]> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  await assertUserIsTransactionParty(client, input.transactionId, input.actorUserId);

  const { data, error } = await client
    .from(CHAT_MESSAGES_TABLE)
    .select("*")
    .eq("transaction_id", input.transactionId.trim())
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ChatMessageRow[]).map(mapChatMessageRow);
}

export async function postTransactionChatMessage(input: {
  transactionId: string;
  actorUserId: string;
  actorHandle: string;
  body: string;
}): Promise<TransactionChatMessage> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  await assertUserIsTransactionParty(client, input.transactionId, input.actorUserId);

  const body = input.body.trim();
  if (body.length < 1 || body.length > 2000) {
    throw new Error("Message body must be between 1 and 2000 characters.");
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from(CHAT_MESSAGES_TABLE)
    .insert({
      transaction_id: input.transactionId.trim(),
      sender_id: input.actorUserId,
      sender_handle: input.actorHandle.trim().toLowerCase(),
      body,
      created_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to send message.");
  }

  return mapChatMessageRow(data as ChatMessageRow);
}

async function fanoutListingToWatchers(listing: Listing): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseAdminClient();

  const haystack = `${listing.cardName} ${listing.setName} ${listing.packTheme ?? ""}`
    .toLowerCase();

  const { data: watches, error } = await client
    .from(WATCHES_TABLE)
    .select("*")
    .neq("user_id", listing.sellerId ?? "");

  if (error || !watches) return;

  const matches = (watches as WatchRow[]).filter((watch) => {
    if (!haystack.includes(watch.query)) return false;
    if (watch.max_price_ars && listing.priceArs > watch.max_price_ars) return false;
    return true;
  });

  if (matches.length === 0) return;

  const now = new Date().toISOString();
  const rows = matches.map((watch) => ({
    user_id: watch.user_id,
    type: "listing_match" as const,
    title: `Nueva publicacion: ${listing.cardName}`,
    body:
      listing.listingType === "mystery_pack"
        ? `Pack sorpresa "${listing.packTheme ?? listing.cardName}" por ARS ${listing.priceArs.toLocaleString("es-AR")}.`
        : `${listing.cardName} (${listing.setName}) por ARS ${listing.priceArs.toLocaleString("es-AR")}.`,
    link_path: "/market",
    created_at: now,
  }));

  await client.from(NOTIFICATIONS_TABLE).insert(rows);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mercado Pago automatic-payment helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stamp a payment_event with the MP preference details right after
 * the preference is created (before the buyer redirects to MP).
 */
export async function updatePaymentMpCheckout(input: {
  transactionId: string;
  mpPreferenceId: string;
  mpCheckoutUrl: string;
  platformFeeArs: number;
}): Promise<void> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { error } = await client
    .from(PAYMENTS_TABLE)
    .update({
      mp_preference_id: input.mpPreferenceId,
      mp_checkout_url: input.mpCheckoutUrl,
      platform_fee_ars: input.platformFeeArs,
    })
    .eq("transaction_id", input.transactionId);
  if (error) throw new Error(error.message);
}

/**
 * Stamp a payment_event with the MP payment_id after the webhook fires.
 */
export async function setPaymentMpPaymentId(input: {
  transactionId: string;
  mpPaymentId: string;
}): Promise<void> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { error } = await client
    .from(PAYMENTS_TABLE)
    .update({ mp_payment_id: input.mpPaymentId })
    .eq("transaction_id", input.transactionId);
  if (error) throw new Error(error.message);
}

/**
 * Find a payment_event by its external_reference (which is the transactionId).
 * Used in webhook processing.
 */
export async function getPaymentEventByExternalRef(
  externalRef: string,
): Promise<PaymentEvent | null> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  // external_reference is stored as transactionId in existing rows.
  // In the new flow we also use it literally.
  const { data, error } = await client
    .from(PAYMENTS_TABLE)
    .select("*")
    .eq("transaction_id", externalRef.trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapPaymentRow(data as PaymentRow);
}

export async function getMpPaymentValidationContext(
  transactionId: string,
): Promise<MpPaymentValidationContext | null> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  const { data: paymentData, error: paymentError } = await client
    .from(PAYMENTS_TABLE)
    .select("transaction_id,listing_id,mp_preference_id,platform_fee_ars")
    .eq("transaction_id", transactionId.trim())
    .maybeSingle();

  if (paymentError) throw new Error(paymentError.message);
  if (!paymentData) return null;

  const payment = paymentData as {
    transaction_id: string;
    listing_id: string;
    mp_preference_id: string | null;
    platform_fee_ars: number | null;
  };

  const { data: listingData, error: listingError } = await client
    .from(LISTINGS_TABLE)
    .select("id,seller_id,price_ars")
    .eq("id", payment.listing_id)
    .maybeSingle();

  if (listingError) throw new Error(listingError.message);
  if (!listingData) return null;

  const listing = listingData as {
    id: string;
    seller_id: string | null;
    price_ars: number;
  };
  if (!listing.seller_id) return null;

  const { data: profileData, error: profileError } = await client
    .from(PROFILES_TABLE)
    .select("mp_user_id")
    .eq("id", listing.seller_id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);

  const expectedSellerMpUserId =
    (profileData as { mp_user_id: string | null } | null)?.mp_user_id ?? "";
  if (!expectedSellerMpUserId) return null;

  return {
    transactionId: payment.transaction_id,
    listingId: listing.id,
    expectedAmountArs: Number(listing.price_ars),
    expectedCurrencyId: "ARS",
    expectedSellerMpUserId,
    expectedPreferenceId: payment.mp_preference_id ?? undefined,
    expectedPlatformFeeArs:
      payment.platform_fee_ars == null ? undefined : Number(payment.platform_fee_ars),
  };
}

export type MpWebhookEventOutcome =
  | "verified"
  | "still_pending"
  | "blocked"
  | "not_found"
  | "invalid_signature"
  | "invalid_json"
  | "ignored"
  | "fetch_failed";

/**
 * Persist a single MP webhook attempt for audit/debugging.
 * Failures here are swallowed — never let auditing break the webhook.
 */
export async function recordMpWebhookEvent(input: {
  rawBody: string;
  xSignature?: string | null;
  xRequestId?: string | null;
  mpPaymentId?: string | null;
  transactionId?: string | null;
  outcome: MpWebhookEventOutcome;
  outcomeReason?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const client = getSupabaseAdminClient();
    await client.from("mp_webhook_events").insert({
      raw_body: input.rawBody,
      x_signature: input.xSignature ?? null,
      x_request_id: input.xRequestId ?? null,
      mp_payment_id: input.mpPaymentId ?? null,
      transaction_id: input.transactionId ?? null,
      outcome: input.outcome,
      outcome_reason: input.outcomeReason ?? null,
    });
  } catch {
    // Never let audit failures break the webhook.
  }
}

export type PendingMpReconcileRow = {
  transactionId: string;
  mpPreferenceId: string | null;
  createdAt: string;
};

/**
 * List `payment_event` rows that:
 *   - are still in `pending_review`,
 *   - have a Mercado Pago checkout in flight (mp_preference_id set),
 *   - were created in the last `windowHours` hours.
 *
 * Used by the reconciliation cron to retry verification when the webhook
 * never closed the loop.
 */
export async function listPendingMpReconciliations(
  windowHours = 48,
): Promise<PendingMpReconcileRow[]> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  const sinceIso = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from(PAYMENTS_TABLE)
    .select("transaction_id, mp_preference_id, created_at")
    .eq("provider", "mercado_pago")
    .eq("verification_status", "pending_review")
    .not("mp_preference_id", "is", null)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<{
    transaction_id: string;
    mp_preference_id: string | null;
    created_at: string;
  }>).map((row) => ({
    transactionId: row.transaction_id,
    mpPreferenceId: row.mp_preference_id,
    createdAt: row.created_at,
  }));
}

/**
 * Get a payment_event by mp_payment_id (set after webhook fires).
 */
export async function getPaymentEventByMpPaymentId(
  mpPaymentId: string,
): Promise<PaymentEvent | null> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(PAYMENTS_TABLE)
    .select("*")
    .eq("mp_payment_id", mpPaymentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapPaymentRow(data as PaymentRow);
}

/**
 * Fetch a single listing by ID (for checkout validation).
 */
export async function getListingById(listingId: string): Promise<Listing | null> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(LISTINGS_TABLE)
    .select("*")
    .eq("id", listingId.trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const listing = mapListingRow(data as ListingRow);
  const [enriched] = await enrichListingsWithMpStatus([listing]);
  return enriched;
}

/**
 * Get the user's MP connection status from the profiles table.
 */
export async function getMpConnectionStatus(
  userId: string,
): Promise<{ mpConnected: boolean; mpUserId: string | null }> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from(PROFILES_TABLE)
    .select("mp_connected, mp_user_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const row = data as { mp_connected: boolean | null; mp_user_id: string | null } | null;
  return {
    mpConnected: Boolean(row?.mp_connected),
    mpUserId: row?.mp_user_id ?? null,
  };
}

/**
 * Get a user's email address from auth.users (service role only).
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  const { data, error } = await client.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}

/**
 * Get a user's email and username by ID.
 */
export async function getUserProfile(
  userId: string,
): Promise<{ email: string | null; username: string } | null> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  const [emailResult, profileResult] = await Promise.all([
    client.auth.admin.getUserById(userId),
    client
      .from(PROFILES_TABLE)
      .select("username")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (emailResult.error || !emailResult.data.user) return null;
  const username =
    (profileResult.data as { username: string } | null)?.username ?? "usuario";

  return {
    email: emailResult.data.user.email ?? null,
    username,
  };
}

// ─── CLAIM SESSIONS ────────────────────────────────────────────────────────

export type CreateClaimSessionInput = {
  sellerId: string;
  sellerHandle: string;
  title: string;
  description?: string;
  cards: Array<{
    inventoryEntryId?: string;
    cardName: string;
    setName?: string;
    imageUrl?: string;
    condition: CardCondition;
    priceArs: number;
  }>;
};

export async function createClaimSession(input: CreateClaimSessionInput): Promise<ClaimSession> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  const { data: session, error: sessionError } = await client
    .from(CLAIM_SESSIONS_TABLE)
    .insert({
      seller_id: input.sellerId,
      seller_handle: input.sellerHandle,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: "draft",
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (sessionError || !session) throw new Error(sessionError?.message ?? "No se pudo crear la sesión.");
  const sessionRow = session as ClaimSessionRow;

  if (input.cards.length > 0) {
    const cardInserts = input.cards.map((card, i) => ({
      session_id: sessionRow.id,
      inventory_entry_id: card.inventoryEntryId ?? null,
      card_name: card.cardName.trim(),
      set_name: card.setName?.trim() || null,
      image_url: card.imageUrl?.trim() || null,
      condition: card.condition,
      price_ars: Math.max(0, Math.round(card.priceArs)),
      order_index: i,
      status: "pending" as ClaimCardStatus,
      created_at: new Date().toISOString(),
    }));

    const { data: cardRows, error: cardError } = await client
      .from(CLAIM_CARDS_TABLE)
      .insert(cardInserts)
      .select("*");

    if (cardError) throw new Error(cardError.message);
    return mapClaimSessionRow(sessionRow, (cardRows ?? []) as ClaimCardRow[]);
  }

  return mapClaimSessionRow(sessionRow, []);
}

export async function listClaimSessions(options?: {
  sellerId?: string;
  status?: ClaimSessionStatus[];
}): Promise<ClaimSession[]> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  let query = client
    .from(CLAIM_SESSIONS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.sellerId) query = query.eq("seller_id", options.sellerId);
  if (options?.status) query = query.in("status", options.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const sessions = ((data ?? []) as ClaimSessionRow[]);
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const { data: cardData, error: cardError } = await client
    .from(CLAIM_CARDS_TABLE)
    .select("*")
    .in("session_id", sessionIds)
    .order("order_index", { ascending: true });

  if (cardError) throw new Error(cardError.message);
  const allCards = (cardData ?? []) as ClaimCardRow[];
  const cardsBySession = new Map<string, ClaimCardRow[]>();
  for (const card of allCards) {
    if (!cardsBySession.has(card.session_id)) cardsBySession.set(card.session_id, []);
    cardsBySession.get(card.session_id)!.push(card);
  }

  return sessions.map((s) => mapClaimSessionRow(s, cardsBySession.get(s.id) ?? []));
}

export async function getClaimSession(sessionId: string): Promise<ClaimSession | null> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  const { data: session, error: sessionError } = await client
    .from(CLAIM_SESSIONS_TABLE)
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) throw new Error(sessionError.message);
  if (!session) return null;

  const { data: cards, error: cardsError } = await client
    .from(CLAIM_CARDS_TABLE)
    .select("*")
    .eq("session_id", sessionId)
    .order("order_index", { ascending: true });

  if (cardsError) throw new Error(cardsError.message);

  return mapClaimSessionRow(session as ClaimSessionRow, (cards ?? []) as ClaimCardRow[]);
}

export async function startClaimSession(input: {
  sessionId: string;
  sellerUserId: string;
}): Promise<ClaimSession> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  const { data: existing, error } = await client
    .from(CLAIM_SESSIONS_TABLE)
    .select("*")
    .eq("id", input.sessionId)
    .single();

  if (error || !existing) throw new Error(error?.message ?? "Sesión no encontrada.");
  const session = existing as ClaimSessionRow;
  if (session.seller_id !== input.sellerUserId) throw new Error("Sin permiso.");
  if (session.status !== "draft") throw new Error("La sesión ya fue iniciada.");

  const { data: firstCard, error: firstCardError } = await client
    .from(CLAIM_CARDS_TABLE)
    .select("*")
    .eq("session_id", input.sessionId)
    .eq("status", "pending")
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstCardError) throw new Error(firstCardError.message);
  if (!firstCard) throw new Error("La sesión no tiene cartas.");

  await client
    .from(CLAIM_CARDS_TABLE)
    .update({ status: "available" })
    .eq("id", (firstCard as ClaimCardRow).id);

  const { data: updatedSession } = await client
    .from(CLAIM_SESSIONS_TABLE)
    .update({ status: "active" })
    .eq("id", input.sessionId)
    .select("*")
    .single();

  const updated = (updatedSession ?? session) as ClaimSessionRow;
  const session_result = await getClaimSession(input.sessionId);
  return session_result ?? mapClaimSessionRow(updated);
}

export async function advanceClaimCard(input: {
  sessionId: string;
  sellerUserId: string;
  skipCurrent?: boolean;
}): Promise<ClaimSession> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  const { data: sessionData } = await client
    .from(CLAIM_SESSIONS_TABLE)
    .select("*")
    .eq("id", input.sessionId)
    .single();

  if (!sessionData) throw new Error("Sesión no encontrada.");
  const session = sessionData as ClaimSessionRow;
  if (session.seller_id !== input.sellerUserId) throw new Error("Sin permiso.");
  if (session.status !== "active") throw new Error("La sesión no está activa.");

  if (input.skipCurrent) {
    await client
      .from(CLAIM_CARDS_TABLE)
      .update({ status: "skipped" })
      .eq("session_id", input.sessionId)
      .eq("status", "available");
  }

  const { data: nextCard } = await client
    .from(CLAIM_CARDS_TABLE)
    .select("*")
    .eq("session_id", input.sessionId)
    .eq("status", "pending")
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextCard) {
    await client
      .from(CLAIM_SESSIONS_TABLE)
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", input.sessionId);
  } else {
    await client
      .from(CLAIM_CARDS_TABLE)
      .update({ status: "available" })
      .eq("id", (nextCard as ClaimCardRow).id);
  }

  const result = await getClaimSession(input.sessionId);
  return result!;
}

export async function claimCard(input: {
  sessionId: string;
  cardId: string;
  userId: string;
  userHandle: string;
}): Promise<ClaimSessionCard> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  const { data: sessionData } = await client
    .from(CLAIM_SESSIONS_TABLE)
    .select("seller_id, seller_handle, status")
    .eq("id", input.sessionId)
    .single();

  if (!sessionData) throw new Error("Sesión no encontrada.");
  const session = sessionData as { seller_id: string; seller_handle: string; status: string };
  if (session.status !== "active") throw new Error("La sesión no está activa.");
  if (session.seller_id === input.userId) throw new Error("No podés claimear tus propias cartas.");

  const now = new Date().toISOString();
  const { data: updated, error } = await client
    .from(CLAIM_CARDS_TABLE)
    .update({
      status: "claimed",
      claimed_by_user_id: input.userId,
      claimed_by_handle: input.userHandle,
      claimed_at: now,
    })
    .eq("id", input.cardId)
    .eq("session_id", input.sessionId)
    .eq("status", "available")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!updated) throw new Error("La carta ya fue claimada por otra persona.");

  const card = mapClaimCardRow(updated as ClaimCardRow);

  const notifs = [
    {
      user_id: session.seller_id,
      type: "system" as const,
      title: "¡Claimaron una carta!",
      body: `@${input.userHandle} claimó ${card.cardName}${card.priceArs > 0 ? ` por ARS ${card.priceArs.toLocaleString("es-AR")}` : " (free)"}. Coordiná la entrega.`,
      link_path: `/my-claims/${input.sessionId}`,
    },
    {
      user_id: input.userId,
      type: "system" as const,
      title: card.priceArs > 0 ? `Claiméaste ${card.cardName}` : `¡${card.cardName} es tuya!`,
      body: card.priceArs > 0
        ? `Coordiná el pago de ARS ${card.priceArs.toLocaleString("es-AR")} con @${session.seller_handle}.`
        : `Coordiná la entrega con @${session.seller_handle}.`,
      link_path: `/claims/${input.sessionId}`,
    },
  ];
  await client.from(NOTIFICATIONS_TABLE).insert(notifs);

  await advanceClaimCard({
    sessionId: input.sessionId,
    sellerUserId: session.seller_id,
    skipCurrent: false,
  });

  return card;
}

export async function endClaimSession(input: {
  sessionId: string;
  sellerUserId: string;
}): Promise<ClaimSession> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();

  const { data: sessionData } = await client
    .from(CLAIM_SESSIONS_TABLE)
    .select("seller_id, status")
    .eq("id", input.sessionId)
    .single();

  if (!sessionData) throw new Error("Sesión no encontrada.");
  const session = sessionData as { seller_id: string; status: string };
  if (session.seller_id !== input.sellerUserId) throw new Error("Sin permiso.");
  if (session.status === "ended") throw new Error("La sesión ya terminó.");

  await client
    .from(CLAIM_SESSIONS_TABLE)
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", input.sessionId);

  await client
    .from(CLAIM_CARDS_TABLE)
    .update({ status: "skipped" })
    .eq("session_id", input.sessionId)
    .eq("status", "available");

  const result = await getClaimSession(input.sessionId);
  return result!;
}

export async function completeOnboarding(userId: string): Promise<void> {
  assertSupabaseReady();
  const client = getSupabaseAdminClient();
  await client
    .from(PROFILES_TABLE)
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", userId);
}
