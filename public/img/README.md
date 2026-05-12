# Imágenes del sitio

Estructura para los assets visuales. Los archivos van acá; las rutas web son `/img/...`.

## Carpetas

- **`hero/`** — Imágenes destacadas del home (4 slots). Reemplazan las cartas Pokémon que hoy se sirven desde `images.pokemontcg.io` cuando no hay listings reales en DB.
- **`empty-states/`** — Ilustraciones para estados vacíos (mercado vacío, inventario vacío, sin alertas, sin claims, sin trades, sin subastas).
- **`og/`** — Open Graph / Twitter Card images (compartir en redes).

## Iconos de la app (van en `/app/`, no acá)

Next.js 16 los detecta automáticamente:
- `app/icon.svg` o `app/icon.png` — favicon (32×32 / 64×64)
- `app/apple-icon.png` — touch icon iOS (180×180)
- `app/opengraph-image.png` — OG default (1200×630)

Ver [AI-IMAGE-PROMPTS.md](../../docs/AI-IMAGE-PROMPTS.md) para los prompts.
