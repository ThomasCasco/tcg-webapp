import * as React from "react";

/**
 * Iconos de tipos Pokémon como SVG inline.
 * Glifos simbólicos minimal (silueta de un elemento por tipo), no los símbolos
 * oficiales — basta para reforzar el chip de color de cada tipo.
 *
 * Fallback: si el tipo no existe en el mapa devolvemos `null` y el chip se ve
 * sólo con color.
 */

const PATHS: Record<string, string> = {
  // flame
  fire: "M12 2c1 4 4 5 4 9a4 4 0 1 1-8 0c0-2 1-3 1-5-2 1-3 3-3 5a5 5 0 0 0 10 0c0-4-3-7-4-9Z",
  // droplet
  water: "M12 2.5c4 5 7 8 7 11.5a7 7 0 1 1-14 0c0-3.5 3-6.5 7-11.5Z",
  // bolt
  electric: "M13 2 4 14h6l-1 8 10-13h-6l1-7Z",
  // leaf
  grass: "M5 19c0-8 6-14 14-14 0 8-6 14-14 14Zm0 0c2-4 5-7 9-9",
  // snowflake (simplified hex star)
  ice: "M12 2v20M3 7l18 10M3 17 21 7M12 6l-3-3m3 3 3-3m-3 18-3-3m3 3 3-3",
  // fist
  fighting: "M7 10V6a2 2 0 1 1 4 0v4m0 0V5a2 2 0 1 1 4 0v5m0 0V7a2 2 0 1 1 4 0v8a6 6 0 0 1-12 0v-3a2 2 0 1 1 4 0",
  // skull-ish drop
  poison: "M8 14c0-3 4-7 4-7s4 4 4 7a4 4 0 1 1-8 0Zm2 8 2-3 2 3",
  // mountain
  ground: "M2 20 9 9l4 6 3-4 6 9H2Z",
  // wing
  flying: "M3 12c6-1 11-4 18-9-2 6-6 11-12 13L3 12Z",
  // eye / orb
  psychic: "M12 4c-5 0-9 4-10 8 1 4 5 8 10 8s9-4 10-8c-1-4-5-8-10-8Zm0 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z",
  // bug antenna
  bug: "M9 3 7 6m8-3 2 3m-5 1a5 5 0 0 1 5 5v6a5 5 0 0 1-10 0v-6a5 5 0 0 1 5-5Zm-5 7H4m16 0h-3m-8 5H4m16 0h-3",
  // rock chunks
  rock: "M4 18 8 8l5 2 4-3 3 11H4Z",
  // ghost
  ghost: "M5 21V11a7 7 0 0 1 14 0v10l-3-2-2 2-2-2-2 2-2-2-3 2ZM9 11h.01M15 11h.01",
  // dragon flame
  dragon: "M12 2c-2 3-4 4-4 7 0 3 2 4 2 6 0 2-2 3-2 5 3 0 5-1 6-3 1 2 3 3 6 3 0-2-2-3-2-5 0-2 2-3 2-6 0-3-2-4-4-7-1 2-2 3-2 5-2-1-2-3-2-5Z",
  // moon
  dark: "M20 14a8 8 0 1 1-9-9 7 7 0 0 0 9 9Z",
  // gear
  steel: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-6v3m0 14v3M5.6 5.6 7.7 7.7m8.6 8.6 2.1 2.1M2 12h3m14 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1",
  // sparkle
  fairy: "M12 3v6m0 6v6M3 12h6m6 0h6m-12-6 4 4m4 4 4 4m-12 0 4-4m4-4 4-4",
  // circle
  normal: "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z",
};

export interface PokemonTypeIconProps extends React.SVGProps<SVGSVGElement> {
  type: string;
  /** Tamaño del SVG en px. Default 14. */
  size?: number;
}

export function PokemonTypeIcon({ type, size = 14, className, ...props }: PokemonTypeIconProps) {
  const d = PATHS[type.toLowerCase()];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}
