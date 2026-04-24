/**
 * PokéAPI (https://pokeapi.co) — gratis, sin API key.
 * Usamos datos ligeros (tipos + sprite) para enriquecer el mercado.
 */

export type PokemonTypeChip = {
  name: string;
  labelEs: string;
  color: string;
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

/** Expone para tests: primer token alfanumérico del título de carta → slug PokéAPI */
export function cardTitleToPokemonSlug(title: string): string | null {
  const cleaned = title
    .replace(/['']/g, "")
    .replace(/[\s\-]*(?:ex|gx|vmax|vstar)$/i, "")
    .trim();
  const token = cleaned.split(/[\s\-–]+/)[0]?.replace(/[^a-zA-Z0-9]/g, "") ?? "";
  if (token.length < 2) return null;
  return token.toLowerCase();
}

export async function getPokemonTypesForCardTitle(
  cardTitle: string,
): Promise<PokemonTypeChip[] | null> {
  const slug = cardTitleToPokemonSlug(cardTitle);
  if (!slug) return null;
  if (speciesCache.has(slug)) {
    return speciesCache.get(slug) ?? null;
  }

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(slug)}`, {
      next: { revalidate: 86_400 },
    });
    if (!res.ok) {
      speciesCache.set(slug, null);
      return null;
    }
    const body = (await res.json()) as {
      types?: Array<{ type?: { name?: string } }>;
    };
    const types = (body.types ?? [])
      .map((t) => t.type?.name)
      .filter((n): n is string => Boolean(n))
      .map((name) => ({
        name,
        labelEs: TYPE_LABEL_ES[name] ?? name,
        color: TYPE_COLOR[name] ?? "#888888",
      }));
    const value = types.length ? types : null;
    speciesCache.set(slug, value);
    return value;
  } catch {
    speciesCache.set(slug, null);
    return null;
  }
}
