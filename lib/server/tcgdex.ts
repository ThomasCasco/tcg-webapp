/**
 * Client for the TCGdex public API (https://tcgdex.dev).
 *
 * Free, open source, no API key required. Returns the same
 * CatalogCardSummary shape we used with pokemontcg.io so the rest
 * of the app can stay untouched.
 *
 * Pricing:
 *  - TCGdex exposes Cardmarket data (EUR) on the detail endpoint.
 *  - TCGplayer data is mostly null, so marketPriceUsd is always null here.
 */

const BASE_URL = "https://api.tcgdex.net/v2";
const LANG = "en";

export type CatalogCardSummary = {
  id: string;
  name: string;
  setName: string;
  setId: string;
  number: string;
  rarity: string | null;
  imageSmall: string | null;
  imageLarge: string | null;
  marketPriceUsd: number | null;
  marketPriceEur: number | null;
};

export type CatalogSet = {
  id: string;
  name: string;
  logo: string | null;
  symbol: string | null;
  cardCount: number;
};

type CardBrief = {
  id: string;
  localId?: string;
  name: string;
  image?: string;
};

type CardFull = {
  id: string;
  localId?: string;
  name: string;
  image?: string;
  rarity?: string;
  set?: { id?: string; name?: string };
  pricing?: {
    cardmarket?: {
      avg?: number | null;
      trend?: number | null;
      low?: number | null;
      "avg30"?: number | null;
    };
    tcgplayer?: unknown;
  };
};

type CacheEntry = { value: CatalogCardSummary[]; expiresAt: number };
const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

type SetsCache = { value: CatalogSet[]; expiresAt: number } | null;
let SETS_CACHE: SetsCache = null;
const SETS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Map from setId to setName, derived from the sets list. Used to enrich
// card search results, which only return id/localId/name/image.
let SET_NAME_BY_ID: Map<string, string> | null = null;

function buildImages(image: string | undefined): {
  imageSmall: string | null;
  imageLarge: string | null;
} {
  if (!image) return { imageSmall: null, imageLarge: null };
  return {
    imageSmall: `${image}/low.png`,
    imageLarge: `${image}/high.png`,
  };
}

function pickCardmarketPrice(card: CardFull): number | null {
  const cm = card.pricing?.cardmarket;
  if (!cm) return null;
  const price = cm.trend ?? cm.avg ?? cm["avg30"] ?? cm.low ?? null;
  return typeof price === "number" && price > 0 ? price : null;
}

function briefToSummary(brief: CardBrief): CatalogCardSummary {
  const dashIndex = brief.id.indexOf("-");
  const setId = dashIndex >= 0 ? brief.id.slice(0, dashIndex) : brief.id;
  const fallbackNumber = dashIndex >= 0 ? brief.id.slice(dashIndex + 1) : "";
  return {
    id: brief.id,
    name: brief.name,
    setName: SET_NAME_BY_ID?.get(setId) ?? "",
    setId,
    number: brief.localId ?? fallbackNumber,
    rarity: null,
    ...buildImages(brief.image),
    marketPriceUsd: null,
    marketPriceEur: null,
  };
}

function fullToSummary(card: CardFull): CatalogCardSummary {
  return {
    id: card.id,
    name: card.name,
    setName: card.set?.name ?? "",
    setId: card.set?.id ?? "",
    number: card.localId ?? "",
    rarity: card.rarity ?? null,
    ...buildImages(card.image),
    marketPriceUsd: null,
    marketPriceEur: pickCardmarketPrice(card),
  };
}

function sanitizeFilter(raw: string): string {
  return raw.replace(/[:"\\]/g, " ").replace(/\s+/g, " ").trim();
}

export async function searchCatalog(
  query: string,
  limit = 24,
  options: { setQuery?: string } = {},
): Promise<CatalogCardSummary[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // Warm the set-name map so briefToSummary can enrich results.
  await listSets().catch(() => []);

  const setQueryRaw = options.setQuery?.trim() ?? "";
  const cacheKey = `q:${trimmed.toLowerCase()}|s:${setQueryRaw.toLowerCase()}|l:${limit}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const params = new URLSearchParams({
    name: `like:${sanitizeFilter(trimmed)}`,
    "pagination:page": "1",
    "pagination:itemsPerPage": String(limit),
  });
  if (setQueryRaw.length >= 2) {
    params.set("set.name", `like:${sanitizeFilter(setQueryRaw)}`);
  }
  const url = `${BASE_URL}/${LANG}/cards?${params.toString()}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new Error(`TCGdex API error: ${response.status}`);
  }

  const payload = (await response.json()) as CardBrief[];
  const mapped = payload.slice(0, limit).map(briefToSummary);

  CACHE.set(cacheKey, { value: mapped, expiresAt: Date.now() + CACHE_TTL_MS });
  return mapped;
}

type RawSet = {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: { total?: number; official?: number };
};

export async function listSets(): Promise<CatalogSet[]> {
  if (SETS_CACHE && SETS_CACHE.expiresAt > Date.now()) {
    return SETS_CACHE.value;
  }

  const response = await fetch(`${BASE_URL}/${LANG}/sets`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error(`TCGdex API error: ${response.status}`);
  }

  const payload = (await response.json()) as RawSet[];
  const mapped: CatalogSet[] = payload.map((set) => ({
    id: set.id,
    name: set.name,
    logo: set.logo ? `${set.logo}.png` : null,
    symbol: set.symbol ? `${set.symbol}.png` : null,
    cardCount: set.cardCount?.total ?? set.cardCount?.official ?? 0,
  }));

  SET_NAME_BY_ID = new Map(mapped.map((set) => [set.id, set.name]));
  SETS_CACHE = { value: mapped, expiresAt: Date.now() + SETS_CACHE_TTL_MS };
  return mapped;
}

export async function fetchCatalogCardById(
  id: string,
): Promise<CatalogCardSummary | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const cacheKey = `id:${trimmed}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value[0] ?? null;

  const response = await fetch(
    `${BASE_URL}/${LANG}/cards/${encodeURIComponent(trimmed)}`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`TCGdex API error: ${response.status}`);
  }

  const payload = (await response.json()) as CardFull;
  if (!payload?.id) return null;

  const summary = fullToSummary(payload);
  CACHE.set(cacheKey, { value: [summary], expiresAt: Date.now() + CACHE_TTL_MS });
  return summary;
}
