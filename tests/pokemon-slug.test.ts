import { describe, expect, it } from "vitest";
import { cardTitleToPokemonSlug } from "@/lib/server/pokeapi";

describe("cardTitleToPokemonSlug", () => {
  it("normaliza sufijos comunes de cartas", () => {
    expect(cardTitleToPokemonSlug("Charizard ex")).toBe("charizard");
    expect(cardTitleToPokemonSlug("Pikachu VMAX")).toBe("pikachu");
  });

  it("devuelve null si no hay slug util", () => {
    expect(cardTitleToPokemonSlug("")).toBeNull();
    expect(cardTitleToPokemonSlug("x")).toBeNull();
  });
});
