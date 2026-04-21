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
  ownerId: string;
  cardId: string;
  cardName: string;
  condition: CardCondition;
  quantity: number;
  askingPriceArs?: number;
  createdAt: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  inventoryId: string;
  cardName: string;
  setName: string;
  condition: CardCondition;
  priceArs: number;
  quantity: number;
  status: ListingStatus;
}

export interface ReputationSnapshot {
  sellerId: string;
  completedOrders: number;
  responseRatio: number;
  accountAgeDays: number;
  averageRating: number;
  reportCount: number;
  score: number;
  tier: "new" | "trusted" | "elite";
}