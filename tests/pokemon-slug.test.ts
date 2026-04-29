import { describe, expect, it } from "vitest";
import { cardTitleToPokemonSlug } from "@/lib/server/pokeapi";

describe("cardTitleToPokemonSlug", () => {
  it("normaliza sufijos comunes de cartas", () => {
    expect(cardTitleToPokemonSlug("Charizard ex")).toBe("charizard");
    expect(cardTitleToPokemonSlug("Pikachu VMAX")).toBe("pikachu");
  });

  it("resuelve alias comunes de nombres complejos", () => {
    expect(cardTitleToPokemonSlug("Mr. Mime")).toBe("mr-mime");
    expect(cardTitleToPokemonSlug("Nidoran♀")).toBe("nidoran-f");
    expect(cardTitleToPokemonSlug("Ho-Oh V")).toBe("ho-oh");
  });

  it("devuelve null si no hay slug util", () => {
    expect(cardTitleToPokemonSlug("")).toBeNull();
    expect(cardTitleToPokemonSlug("x")).toBeNull();
  });
});
