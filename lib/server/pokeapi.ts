/**
 * PokéAPI (https://pokeapi.co) — gratis, sin API key.
 * Usamos datos ligeros (tipos + sprite) para enriquecer el mercado.
 */

export type PokemonTypeChip = {
  name: string;
  labelEs: string;
  color: string;
};

export type PokemonCardEnrichment = {
  slug: string;
  pokemonName: string;
  speciesNameEs: string | null;
  spriteUrl: string | null;
  types: PokemonTypeChip[] | null;
};

const TYPE_LABEL_ES: Record<string, string> = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

const TYPE_COLOR: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

const speciesCache = new Map<string, PokemonTypeChip[] | null>();
const enrichmentCache = new Map<string, PokemonCardEnrichment | null>();
const enrichmentBySlugCache = new Map<string, PokemonCardEnrichment | null>();
const slugByTitleCache = new Map<string, string | null>();
const TITLE_SUFFIX_RE = /[\s\-]*(?:ex|gx|vmax|vstar|v|radiant)$/i;
const SLUG_ALIASES: Record<string, string> = {
  mrmime: "mr-mime",
  mimejr: "mime-jr",
  nidoranf: "nidoran-f",
  nidoranm: "nidoran-m",
  farfetchd: "farfetchd",
  sirfetchd: "sirfetchd",
  typenull: "type-null",
  hooh: "ho-oh",
  porygonz: "porygon-z",
};

type PokemonApiResponse = {
  name?: string;
  types?: Array<{ type?: { name?: string } }>;
  sprites?: {
    other?: {
      "official-artwork"?: { front_default?: string | null };
    };
    front_default?: string | null;
  };
  species?: { url?: string };
};

type PokemonSpeciesResponse = {
  names?: Array<{ name?: string; language?: { name?: string } }>;
};

function normalizeToken(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/♀/g, "f")
    .replace(/♂/g, "m")
    .replace(/[^a-z0-9]/g, "");
}

function buildSlugCandidates(title: string): string[] {
  const cleaned = title
    .replace(/['’.]/g, "")
    .replace(TITLE_SUFFIX_RE, "")
    .trim();
  const parts = cleaned
    .split(/[\s\-–]+/)
    .map(normalizeToken)
    .filter(Boolean);
  if (parts.length === 0) return [];

  const singles = parts.slice(0, 2);
  const joined = parts.length >= 2 ? [parts.slice(0, 2).join("")] : [];
  const candidates = [...joined, ...singles]
    .map((token) => SLUG_ALIASES[token] ?? token)
    .map((token) => token.toLowerCase());

  return [...new Set(candidates)];
}

async function fetchSpeciesNameEs(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 86_400 } });
    if (!res.ok) return null;
    const body = (await res.json()) as PokemonSpeciesResponse;
    return (
      body.names?.find((name) => name.language?.name === "es")?.name ??
      body.names?.find((name) => name.language?.name === "en")?.name ??
      null
    );
  } catch {
    return null;
  }
}

async function fetchEnrichmentBySlug(slug: string): Promise<PokemonCardEnrichment | null> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(slug)}`, {
    next: { revalidate: 86_400 },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as PokemonApiResponse;
  const types = (body.types ?? [])
    .map((t) => t.type?.name)
    .filter((n): n is string => Boolean(n))
    .map((name) => ({
      name,
      labelEs: TYPE_LABEL_ES[name] ?? name,
      color: TYPE_COLOR[name] ?? "#888888",
    }));

  return {
    slug,
    pokemonName: body.name ?? slug,
    speciesNameEs: await fetchSpeciesNameEs(body.species?.url),
    spriteUrl:
      body.sprites?.other?.["official-artwork"]?.front_default ??
      body.sprites?.front_default ??
      null,
    types: types.length ? types : null,
  };
}

/** Expone para tests: primer token alfanumérico del título de carta → slug PokéAPI */
export function cardTitleToPokemonSlug(title: string): string | null {
  const key = title.trim().toLowerCase();
  if (!key) return null;
  if (slugByTitleCache.has(key)) return slugByTitleCache.get(key) ?? null;
  const candidate = buildSlugCandidates(title)[0] ?? null;
  const value = candidate && candidate.length >= 2 ? candidate : null;
  slugByTitleCache.set(key, value);
  return value;
}

export async function getPokemonTypesForCardTitle(
  cardTitle: string,
): Promise<PokemonTypeChip[] | null> {
  const enrichment = await getPokemonEnrichmentForCardTitle(cardTitle);
  return enrichment?.types ?? null;
}

export async function getPokemonEnrichmentForCardTitle(
  cardTitle: string,
): Promise<PokemonCardEnrichment | null> {
  const titleKey = cardTitle.trim().toLowerCase();
  if (!titleKey) return null;
  if (enrichmentCache.has(titleKey)) return enrichmentCache.get(titleKey) ?? null;

  const candidates = buildSlugCandidates(cardTitle);
  for (const slug of candidates) {
    try {
      if (enrichmentBySlugCache.has(slug)) {
        const cached = enrichmentBySlugCache.get(slug) ?? null;
        if (cached) {
          enrichmentCache.set(titleKey, cached);
          slugByTitleCache.set(titleKey, slug);
          return cached;
        }
        continue;
      }
      const enrichment = await fetchEnrichmentBySlug(slug);
      speciesCache.set(slug, enrichment?.types ?? null);
      enrichmentBySlugCache.set(slug, enrichment);
      if (enrichment) {
        enrichmentCache.set(titleKey, enrichment);
        slugByTitleCache.set(titleKey, slug);
        return enrichment;
      }
    } catch {
      speciesCache.set(slug, null);
    }
  }
  enrichmentCache.set(titleKey, null);
  return null;
}
