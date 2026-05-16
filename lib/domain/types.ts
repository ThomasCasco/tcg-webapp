export type CardCondition =
  | "mint"
  | "near_mint"
  | "lightly_played"
  | "moderately_played"
  | "heavily_played"
  | "damaged";

export type ListingStatus =
  | "active"
  | "pending_payment"
  | "sold"
  | "cancelled";

export type PaymentProvider = "mercado_pago" | "stripe" | "external_link";

export type SellerPaymentProvider =
  | "mercado_pago"
  | "bank_transfer"
  | "cash"
  | "other";

export type PaymentVerificationStatus = "verified" | "pending_review";

export type FulfillmentStatus =
  | "pending"
  | "seller_confirmed"
  | "shipped"
  | "delivered"
  | "disputed"
  | "closed";

export type DisputeStatus = "open" | "investigating" | "resolved" | "rejected";

export type TradeProposalStatus =
  | "pending"
  | "accepted"
  | "completed"
  | "declined"
  | "cancelled";

export interface CatalogCard {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  marketRefPriceArs: number;
}

export interface InventoryEntry {
  id: string;
  ownerId?: string;
  sellerHandle: string;
  cardName: string;
  setName?: string;
  catalogCardId?: string;
  imageUrl?: string;
  backImageUrl?: string;
  condition: CardCondition;
  quantity: number;
  askingPriceArs?: number;
  availableForTrade?: boolean;
  tradeNotes?: string;
  createdAt: string;
}

export type ListingType = "single" | "mystery_pack";

export type AuctionStatus =
  | "scheduled"
  | "active"
  | "ended"
  | "cancelled"
  | "settled";

export interface Listing {
  id: string;
  sellerId?: string;
  sellerHandle: string;
  inventoryId?: string;
  cardName: string;
  setName: string;
  catalogCardId?: string;
  imageUrl?: string;
  condition: CardCondition;
  priceArs: number;
  quantity: number;
  status: ListingStatus;
  listingType: ListingType;
  packCardCount?: number;
  packRarityFloor?: string;
  packTheme?: string;
  packDescription?: string;
  /** Inicio de reserva pendiente de pago (para liberar automaticamente). */
  reservedAt?: string;
  createdAt: string;
  /** Ofrece envío postal / courier. */
  offersShipping?: boolean;
  /** Ofrece retiro en persona. */
  offersPickup?: boolean;
  /** Dónde y cómo: zona de retiro, couriers, costos, horarios. */
  deliveryAreaNotes?: string;
  /**
   * True si el vendedor tiene Mercado Pago conectado.
   * Cuando es true, el flujo de pago es automatico (checkout MP).
   * Cuando es false/undefined, el flujo es P2P (alias/CBU/coordinacion manual).
   */
  sellerMpConnected?: boolean;
}

/** Transacción + datos de la publicación para la UI de seguimiento. */
export interface PaymentEventWithListing extends PaymentEvent {
  listingCardName?: string;
  listingSetName?: string;
  listingSellerHandle?: string;
  offersShipping?: boolean;
  offersPickup?: boolean;
  deliveryAreaNotes?: string;
}

/** Mensaje de chat ligado a una transacción (mismo hilo comprador–vendedor). */
export interface TransactionChatMessage {
  id: string;
  transactionId: string;
  senderId: string;
  senderHandle: string;
  body: string;
  createdAt: string;
}

export interface CardWatch {
  id: string;
  userId: string;
  username?: string;
  query: string;
  maxPriceArs?: number;
  publicWanted?: boolean;
  notes?: string;
  createdAt: string;
}

export interface AuctionListing {
  id: string;
  sellerId?: string;
  sellerHandle: string;
  inventoryId?: string;
  cardName: string;
  setName?: string;
  catalogCardId?: string;
  imageUrl?: string;
  condition: CardCondition;
  quantity: number;
  status: AuctionStatus;
  startPriceArs: number;
  bidIncrementArs: number;
  currentPriceArs: number;
  buyoutPriceArs?: number;
  bidCount: number;
  winnerId?: string;
  winnerHandle?: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  offersShipping?: boolean;
  offersPickup?: boolean;
  deliveryAreaNotes?: string;
  /** Suscripciones a "avisame cuando empiece" (solo cuando aplica). */
  subscriberCount?: number;
  /** true si el viewer actual está suscripto (lo setea el server al cargar). */
  viewerSubscribed?: boolean;
}

export interface AuctionSubscription {
  id: string;
  auctionId: string;
  userId: string;
  createdAt: string;
  notifiedAt?: string;
}

export interface AuctionBid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderHandle: string;
  amountArs: number;
  createdAt: string;
}

export interface TradeProfile {
  userId: string;
  username: string;
  tradeCards: InventoryEntry[];
  wantedCards: CardWatch[];
}

export interface SocialProfile {
  userId: string;
  username: string;
  displayName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  favoriteGame?: string;
  favoriteCard?: string;
  instagram?: string;
  discord?: string;
  completionScore: number;
  tradeCount: number;
  wantedCount: number;
  listingCount: number;
  followersCount: number;
  followingCount: number;
  badges: string[];
  joinedAt?: string;
  updatedAt: string;
  onboardingCompletedAt?: string;
}

export interface PublicProfileDetail {
  profile: SocialProfile;
  tradeCards: InventoryEntry[];
  wantedCards: CardWatch[];
  listings: Listing[];
  isFollowing?: boolean;
}

export interface TradeProposal {
  id: string;
  proposerId: string;
  proposerHandle: string;
  recipientId: string;
  recipientHandle: string;
  offeredInventoryIds: string[];
  requestedInventoryIds: string[];
  message?: string;
  status: TradeProposalStatus;
  proposerConfirmedAt?: string;
  recipientConfirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "listing_match" | "transaction_update" | "dispute_update" | "system";
  title: string;
  body: string;
  linkPath?: string;
  readAt?: string;
  createdAt: string;
}

export interface PaymentEvent {
  id: string;
  transactionId: string;
  listingId: string;
  /** Set when the transaction originated from an auction (listing is empty). */
  auctionId?: string;
  sellerId?: string;
  sellerHandle?: string;
  buyerId?: string;
  buyerHandle: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  providerStatus: string;
  verificationStatus: PaymentVerificationStatus;
  fulfillmentStatus?: FulfillmentStatus;
  shippingTracking?: string;
  checkedAt: string;
  createdAt: string;
}

// ─── CLAIMS ────────────────────────────────────────────────────────────────

export type ClaimSessionStatus = "draft" | "active" | "ended";
export type ClaimCardStatus = "pending" | "available" | "claimed" | "skipped";

export interface ClaimSession {
  id: string;
  sellerId: string;
  sellerHandle: string;
  title: string;
  description?: string;
  status: ClaimSessionStatus;
  createdAt: string;
  endedAt?: string;
  cards?: ClaimSessionCard[];
  /** Derived: count of pending + available cards remaining. */
  remainingCount?: number;
  /** Derived: count of claimed cards. */
  claimedCount?: number;
}

export interface ClaimSessionCard {
  id: string;
  sessionId: string;
  inventoryEntryId?: string;
  cardName: string;
  setName?: string;
  imageUrl?: string;
  condition: CardCondition;
  priceArs: number;
  orderIndex: number;
  status: ClaimCardStatus;
  claimedByUserId?: string;
  claimedByHandle?: string;
  claimedAt?: string;
  createdAt: string;
}

export interface DisputeEvent {
  id: string;
  transactionId: string;
  openedById?: string;
  openedByHandle: string;
  reason: string;
  details: string;
  status: DisputeStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface ReputationSnapshot {
  sellerHandle: string;
  completedOrders: number;
  responseRatio: number;
  accountAgeDays: number;
  averageRating: number;
  reportCount: number;
  score: number;
  tier: "new" | "trusted" | "elite";
}

export interface SellerPaymentProfile {
  userId: string;
  username: string;
  whatsapp?: string;
  paymentProvider: SellerPaymentProvider;
  paymentAlias?: string;
  paymentInstructions?: string;
  updatedAt: string;
}

export interface SellerPaymentDetails {
  sellerId?: string;
  sellerHandle: string;
  paymentProvider?: SellerPaymentProvider;
  paymentAlias?: string;
  paymentInstructions?: string;
  whatsapp?: string;
}
