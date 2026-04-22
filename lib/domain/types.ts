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

export type PaymentVerificationStatus = "verified" | "pending_review";

export type FulfillmentStatus =
  | "pending"
  | "seller_confirmed"
  | "shipped"
  | "delivered"
  | "disputed"
  | "closed";

export type DisputeStatus = "open" | "investigating" | "resolved" | "rejected";

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
  condition: CardCondition;
  quantity: number;
  askingPriceArs?: number;
  createdAt: string;
}

export type ListingType = "single" | "mystery_pack";

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
  createdAt: string;
}

export interface CardWatch {
  id: string;
  userId: string;
  query: string;
  maxPriceArs?: number;
  createdAt: string;
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
  buyerId?: string;
  buyerHandle: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  providerStatus: string;
  verificationStatus: PaymentVerificationStatus;
  fulfillmentStatus?: FulfillmentStatus;
  checkedAt: string;
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