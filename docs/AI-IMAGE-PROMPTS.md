# Prompts AI para generar las imágenes que faltan

Esta guía lista los slots donde el sitio necesita imágenes propias, qué generar con AI y qué buscar real. La idea es matar la pinta de "landing genérica" sin pagar un diseñador todavía.

> **Reglas globales para todos los prompts:**
>
> - Paleta del sitio: azul accent `#3D7BFD` (claro `#6DA1FF`), fondo oscuro `#06080F`, tinta `#F4F6FB`. Pedir explícitamente en el prompt.
> - **Sin texto en las imágenes** salvo que se indique (los modelos AI escriben texto mal).
> - Estilo: **flat, geométrico, mono-color o duotone**. Cero gradientes mágicos, cero glow rosa-violeta, cero "iridescent holographic" — eso es justo lo que da pinta de scam.
> - Para empty-states: línea fina, mucho aire, blanco/azul sobre transparente.
> - **Negative prompt** recomendado para SDXL/Midjourney: `photorealistic, 3d render, lens flare, gradient overlay, hologram, neon glow, text, watermark, logo`.

---

## 1. Brand logo y favicon

| Archivo | Tamaño | Formato |
|---|---|---|
| `app/icon.svg` | 64×64 (viewbox) | SVG vector |
| `app/apple-icon.png` | 180×180 | PNG |

**Prompt sugerido (Midjourney / SDXL / Recraft):**

> Minimalist vector logo monogram for a Pokemon trading-card marketplace called "TCG.ar". Letters T C G stacked or interlocked, geometric sans-serif, single solid color #3D7BFD on transparent background, flat 2D, no gradient, no glow, no shadow, badge-style enclosed in a soft-corner square. Style: Linear icon set, Material Symbols influence.

**Consejo:** la AI casi nunca acierta texto. **Mejor estrategia:** generar 4-6 variantes del monograma como inspiración → pasar a Figma → vectorizar a mano la que más te guste. O directamente armarlo con tipografía Sora (la del sitio) en 3 minutos.

---

## 2. Open Graph image (compartir en WhatsApp / X / FB)

| Archivo | Tamaño | Formato |
|---|---|---|
| `app/opengraph-image.png` | **1200×630** | PNG |
| `app/twitter-image.png` | 1200×630 | PNG (opcional, mismo) |

**Prompt sugerido:**

> Banner image 1200x630, Pokemon trading card marketplace promotional graphic. Three classic Pokemon cards (Charizard, Blastoise, Pikachu base set style) arranged as a fan on the right side, slightly tilted, casting subtle shadow. Left side empty for text overlay. Background: deep navy #06080F with a very faint dotted grid pattern, no gradient. Lighting: soft directional from top-left, no glow. Flat color blocking, magazine-cover composition.

**Después de generar:**
- Abrir el PNG, agregar arriba con tipografía Sora bold: **"Mercado argentino de cartas Pokémon"**
- Abajo más chico: **"tcg.ar"**
- Lo podés hacer en Figma en 2 minutos o usar `next/og` para que se genere dinámico (decime si querés que te lo arme).

**Alternativa más fácil:** No usar AI. Tomarle foto a tres cartas reales sobre fondo negro mate con luz lateral, recortar, listo.

---

## 3. Empty states (6 ilustraciones)

Todas en `public/img/empty-states/`, formato **SVG** preferido (escalan). Si la AI no exporta SVG limpio, usar PNG 400×400 transparente.

### 3a. `market-empty.svg` — "Aún no hay publicaciones"
> Minimal line-art illustration of an empty cardboard box tilted open on its side, no products inside, a single Pokeball drawn next to it as if rolling out. Pure line art, 2px stroke, white #F4F6FB on transparent background, no fill, no shadow, no color. 400x400, centered with padding.

### 3b. `inventory-empty.svg` — "Cargá tu primera carta"
> Minimal line-art of an empty trading-card binder, open with empty plastic sleeves visible. 2px stroke, monochrome white on transparent. Flat 2D, isometric perspective slight. 400x400.

### 3c. `auctions-empty.svg` — "Sin subastas activas"
> Minimal line-art of an auctioneer's gavel resting on a wooden block, completely flat 2D side view, 2px stroke, white on transparent. 400x400.

### 3d. `trades-empty.svg` — "Sin perfiles de trade"
> Minimal line-art of two trading cards crossing each other forming an X, arrows curving around them showing exchange direction. 2px stroke, white on transparent. 400x400.

### 3e. `claims-empty.svg` — "Sin claims abiertos"
> Minimal line-art of an open envelope with a small card peeking out. 2px stroke, white on transparent. 400x400.

### 3f. `alerts-empty.svg` — "Sin alertas guardadas"
> Minimal line-art of a bell with a thin line crossing it (disabled/empty state). 2px stroke, white on transparent. 400x400.

**Herramienta recomendada para estas:** [Recraft](https://www.recraft.ai/) (genera SVG nativo) o **Stable Diffusion + control net "scribble"** para line-art. Midjourney también sirve pero exporta raster.

**Después de generar:** Pasar por [SVGOMG](https://jakearchibald.github.io/svgomg/) para optimizar.

---

## 4. Imágenes del hero (4 slots actuales)

**Estado actual:** [app/(public)/page.tsx](../app/(public)/page.tsx) usa 4 cartas de Base Set 1999 servidas desde `images.pokemontcg.io` (oficiales, libres de uso de la API pública de Pokémon TCG, ya whitelisted en CSP).

**No hace falta AI acá** — las cartas reales son más creíbles que cualquier render. Si querés cambiar la curaduría, editá `HERO_SAMPLE_CARDS` en esa página. URLs disponibles:

| Carta | URL |
|---|---|
| Charizard Base | `https://images.pokemontcg.io/base1/4_hires.png` |
| Blastoise Base | `https://images.pokemontcg.io/base1/2_hires.png` |
| Venusaur Base | `https://images.pokemontcg.io/base1/15_hires.png` |
| Pikachu Base | `https://images.pokemontcg.io/base1/58_hires.png` |
| Mewtwo Base | `https://images.pokemontcg.io/base1/10_hires.png` |
| Pikachu VMAX Rainbow | `https://images.pokemontcg.io/swsh4/188_hires.png` |
| Ho-Oh / Lugia / Mew | Buscar en https://pokemontcg.io/sets |

**Catálogo completo:** https://docs.pokemontcg.io/api-reference/cards/get-card

Para mejor performance, descargá las 4 que uses, ponelas en `public/img/hero/` y cambiá los URLs a `/img/hero/charizard.png` (evita dependencia externa y mejora LCP).

---

## 5. Avatar default (cuando un usuario no subió foto)

**Estado actual:** [components/ui/avatar.tsx](../components/ui/avatar.tsx) muestra iniciales sobre fondo azul sólido. Está bien así.

**Si querés algo más copado:** generar 8 patrones tipo "geometric identicon" y elegir uno por hash del username.

> Prompt: 8 distinct minimal geometric identicon-style avatars, 64x64 each, flat 2D, two-tone (white + #3D7BFD blue), simple shapes: triangles, circles, diagonal stripes, dots. Tileable patterns, no human faces, no animals. Each one visually distinct.

Después usás algo así para asignar:
```ts
const variant = hash(username) % 8;
return `/img/avatars/pattern-${variant}.svg`;
```

---

## 6. Iconos de tipos Pokémon (energía)

**Estado actual:** **YA ENCHUFADO**. Renderizamos un SVG inline minimal con [components/ui/pokemon-type-icon.tsx](../components/ui/pokemon-type-icon.tsx) — un glifo simbólico por tipo (llama, gota, rayo, hoja, etc.) usado dentro del chip de color.

**Nota:** El package `pokemon-icons-font` que mencioné antes **NO existe** en npm — me lo inventé. La implementación inline cubre los 18 tipos sin dependencia externa.

Si querés los símbolos oficiales (los de las cartas reales, círculo de fuego, etc.), están en Bulbapedia:
`https://archives.bulbagarden.net/wiki/Category:Type_icons` — bajalos y reemplazá los paths en `pokemon-type-icon.tsx`.

---

## 7. Background pattern (opcional, sutil)

Si en algún momento querés un fondo menos plano sin volver a los gradientes:

> Seamless tiling pattern, 200x200, very subtle dot grid OR very subtle TCG card border outline pattern at 6% opacity, monochrome white on transparent. Flat, no gradient.

Aplicar con CSS:
```css
body {
  background-image: url('/img/pattern.svg');
  background-repeat: repeat;
  background-attachment: fixed;
  opacity: 0.06; /* o ajustar en el SVG mismo */
}
```

Si lo ves "muy mucho" sacalo, mejor sin patrón que con uno que distraiga.

---

## Resumen: lo que conviene hacer y en qué orden

| Prioridad | Asset | Tool | Tiempo estimado |
|---|---|---|---|
| 🔴 Alta | OG image | Foto real o Midjourney + Figma | 30 min |
| 🔴 Alta | App icon / favicon | Figma a mano con tipografía Sora | 20 min |
| 🟡 Media | 6 empty-state SVGs | Recraft o SDXL | 1 h |
| 🟢 Baja | Avatares geométricos | Recraft | 30 min |
| 🟢 Baja | Background pattern | SDXL | 15 min (probablemente lo sacás) |

**Lo que NO conviene generar con AI:**
- Cartas Pokémon (usar la API oficial, son gratis y reales).
- Iconos de tipos Pokémon (existen oficiales).
- Texto (la AI siempre tipea mal).
- Fotos de gente / coleccionistas reales (preferible foto real o stock).
