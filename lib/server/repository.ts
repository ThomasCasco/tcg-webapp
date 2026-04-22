import type {
  CardCondition,
  CardWatch,
  DisputeEvent,
  DisputeStatus,
  FulfillmentStatus,
  InventoryEntry,
  Listing,
  ListingStatus,
  ListingType,
  Notification,
  PaymentEvent,
  PaymentProvider,
  PaymentVerificationStatus,
} from "@/lib/domain/types";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/server/supabase";

const INVENTORY_TABLE = "inventory_entries";
const LISTINGS_TABLE = "market_listings";
const PAYMENTS_TABLE = "payment_events";
const DISPUTES_TABLE = "dispute_events";
const WATCHES_TABLE = "card_watches";
const NOTIFICATIONS_TABLE = "notifications";

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
};

type WatchRow = {
  id: string;
  user_id: string;
  query: string;
  max_price_ars: number | null;
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

type PaymentRow = {
  id: string;
  transaction_id: string;
  listing_id: string;
  buyer_id: string | null;
  buyer_handle: string;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  provider_status: string;
  verification_status: PaymentVerificationStatus;
  fulfillment_status: FulfillmentStatus;
  shipping_tracking: string | null;
  checked_at: string;
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
    createdAt: row.created_at,
  };
}

function mapWatchRow(row: WatchRow): CardWatch {
  return {
    id: row.id,
    userId: row.user_id,
    query: row.query,
    maxPriceArs: row.max_price_ars ?? undefined,
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

function mapPaymentRow(row: PaymentRow): PaymentEvent {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    listingId: row.listing_id,
    buyerId: row.buyer_id ?? undefined,
    buyerHandle: row.buyer_handle,
    provider: row.provider,
    providerPaymentId: row.provider_payment_id ?? undefined,
    providerStatus: row.provider_status,
    verificationStatus: row.verification_status,
    fulfillmentStatus: row.fulfillment_status,
    checkedAt: row.checked_at,
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

function assertSupabaseReady() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Backend not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
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
        ? "Run supabase/migrate-v2.sql in Supabase SQL Editor to create the missing tables/columns."
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

  const updates: Record<string, number> = {};
  if (typeof input.askingPriceArs === "number") {
    updates.asking_price_ars = Math.max(0, Math.round(input.askingPriceArs));
  }
  if (typeof input.quantity === "number") {
    updates.quantity = Math.max(1, Math.round(input.quantity));
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

  return ((data ?? []) as ListingRow[]).map(mapListingRow);
}

export async function createListing(input: CreateListingInput): Promise<Listing> {
  assertSupabaseReady();

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
    .update({ status: "cancelled" })
    .eq("id", input.listingId)
    .eq("seller_id", input.sellerId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to cancel listing.");
  }

  return mapListingRow(data as ListingRow);
}

export async function reserveListing(input: ReserveListingInput): Promise<{
  listing: Listing;
  transactionId: string;
}> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const listingId = input.listingId.trim();

  const { data: listingCheck, error: listingCheckError } = await client
    .from(LISTINGS_TABLE)
    .select("id,seller_id")
    .eq("id", listingId)
    .single();

  if (listingCheckError || !listingCheck) {
    throw new Error("Listing is not available.");
  }

  if ((listingCheck as { seller_id: string | null }).seller_id === input.buyerId) {
    throw new Error("You cannot reserve your own listing.");
  }

  const { data: activeListing, error: activeError } = await client
    .from(LISTINGS_TABLE)
    .update({ status: "pending_payment" })
    .eq("id", listingId)
    .eq("status", "active")
    .select("*")
    .single();

  if (activeError || !activeListing) {
    throw new Error("Listing is not available.");
  }

  const transactionId = `tx_${Date.now()}`;
  const now = new Date().toISOString();

  const { error: paymentError } = await client.from(PAYMENTS_TABLE).insert({
    transaction_id: transactionId,
    listing_id: listingId,
    buyer_id: input.buyerId,
    buyer_handle: input.buyerHandle.trim().toLowerCase(),
    provider: "external_link",
    provider_payment_id: null,
    provider_status: "pending",
    verification_status: "pending_review",
    fulfillment_status: "pending",
    shipping_tracking: null,
    checked_at: now,
    created_at: now,
  });

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  return {
    listing: mapListingRow(activeListing as ListingRow),
    transactionId,
  };
}

export async function verifyTransaction(input: VerifyTransactionInput): Promise<{
  payment: PaymentEvent;
  requiresManualCheck: boolean;
}> {
  assertSupabaseReady();

  const client = getSupabaseAdminClient();
  const normalizedStatus = input.providerStatus.trim().toLowerCase();
  const verificationStatus: PaymentVerificationStatus =
    SUCCESS_PROVIDER_STATUSES.has(normalizedStatus) ? "verified" : "pending_review";

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
      .update({ status: "sold" })
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

export async function listTransactionsForUser(userId: string): Promise<PaymentEvent[]> {
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

  const { data: sellerListings, error: sellerListingsError } = await client
    .from(LISTINGS_TABLE)
    .select("id")
    .eq("seller_id", userId);

  if (sellerListingsError) {
    throw new Error(sellerListingsError.message);
  }

  const listingIds = (sellerListings ?? []).map((row) => (row as { id: string }).id);

  let bySeller: PaymentRow[] = [];
  if (listingIds.length > 0) {
    const { data: sellerPayments, error: sellerPaymentsError } = await client
      .from(PAYMENTS_TABLE)
      .select("*")
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false });

    if (sellerPaymentsError) {
      throw new Error(sellerPaymentsError.message);
    }

    bySeller = (sellerPayments ?? []) as PaymentRow[];
  }

  const merged = new Map<string, PaymentRow>();
  for (const row of ([...(byBuyer ?? []), ...bySeller] as PaymentRow[])) {
    merged.set(row.id, row);
  }

  return Array.from(merged.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(mapPaymentRow);
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
