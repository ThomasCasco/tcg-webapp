# TCG Marketplace AR

Pokemon-first marketplace MVP for semi-vendedores in Argentina.

Current implementation focus:
- Web PWA foundation with Next.js App Router
- Inventory and listing flows with persistent backend
- Supabase Auth real con sesion por cookies
- Hybrid pricing suggestion endpoint
- Mercado Pago OAuth, checkout, webhook y reconciliacion conectados a transaction state
- Post-venta: fulfillment status + dispute workflows
- Supabase schema for beta launch

## Backend Setup (Supabase)

1. Create a Supabase project.
2. Open SQL Editor and run en este orden:
   - [supabase/schema.sql](supabase/schema.sql) (solo si es un proyecto nuevo).
   - [supabase/migrate-v2.sql](supabase/migrate-v2.sql) (columnas de ownership — owner_id, seller_id, buyer_id, etc.).
   - [supabase/migrate-v3.sql](supabase/migrate-v3.sql) (catalogo Pokemon TCG, alertas, notificaciones, mystery packs).
	- [supabase/migrate-v4.sql](supabase/migrate-v4.sql) (perfil de cobro del vendedor para flujo P2P).
	- [supabase/migrate-v5.sql](supabase/migrate-v5.sql) (bucket `card-images` en Storage + columna `reserved_at` en publicaciones).
	- [supabase/migrate-v6.sql](supabase/migrate-v6.sql) (envío / retiro + texto de ubicación en `market_listings`).
	- [supabase/migrate-v7.sql](supabase/migrate-v7.sql) (chat P2P por `transaction_id` en `transaction_chat_messages`).
3. Add env vars in local and production:
	- APP_URL / NEXT_PUBLIC_APP_URL
	- NEXT_PUBLIC_SUPABASE_URL
	- NEXT_PUBLIC_SUPABASE_ANON_KEY
	- SUPABASE_SERVICE_ROLE_KEY
	- MP_APP_ID
	- MP_CLIENT_SECRET
	- MP_ACCESS_TOKEN
	- MP_REDIRECT_URI
	- MP_WEBHOOK_SECRET
	- PLATFORM_FEE_PERCENT
	- RESEND_API_KEY / EMAIL_FROM
	- ADMIN_SECRET
	- CRON_SECRET
4. Start the app with npm run dev and verifica con `GET /api/health` que `backend.connected` sea `true`.

## Fotos de cartas y storage gratuito

Las subidas van a **Supabase Storage** (bucket `card-images`, ver `migrate-v5.sql`). El backend usa `SUPABASE_SERVICE_ROLE_KEY` y devuelve una URL pública.

| Opción | Notas |
|--------|--------|
| **Supabase Storage** (elegida) | Incluido en el plan gratuito del mismo proyecto (~1 GB). Misma cuenta, políticas y URLs simples. Ideal para MVP. |
| **Cloudflare R2** | Tier gratuito generoso, **egress gratis**; conviene si tenés muchísimo tráfico de descarga. Sumás otro proveedor y wiring. |
| **Firebase Storage** | Tier gratuito razonable; otro panel y reglas. |
| **Uploadthing / similar** | Muy rápido de integrar en front; capa extra y términos propios. |

Para esta app, **Supabase es la mejor relación simplicidad + costo cero** porque ya dependés de Supabase para Auth y DB.

## Tests

```bash
npm run test
```

Ejecuta Vitest sobre `tests/*.test.ts` (smoke de utilidades).

## Catalogo de cartas

El catalogo se consume de [TCGdex](https://tcgdex.dev), API publica gratuita y
open source (no requiere API key). Trae imagenes y precios de referencia de
Cardmarket (EUR). Si en el futuro queres datos pagos de USD / graded, se puede
reemplazar el cliente en `lib/server/tcgdex.ts` por uno de Scrydex.

## Getting Started

Install dependencies and run local dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run test
```

## Key Routes

- `/` product landing
- `/login` login real con Supabase Auth
- `/register` registro real con Supabase Auth
- `/forgot-password` recuperacion de password por email
- `/reset-password` cambio de password desde link de Supabase
- `/inventory` seller inventory panel (protegido)
- `/listings` seller listing panel (protegido, soporta mystery packs)
- `/transactions` seguimiento post-venta (protegido)
- `/disputes` centro de disputas (protegido)
- `/alerts` watchlist + notificaciones (protegido)
- `/market` buyer-facing market index (filtros por cartas o packs, busqueda)
- `/terms` Terminos y Condiciones

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/health`
- `GET,POST,PATCH,DELETE /api/inventory`
- `GET,POST,PATCH /api/listings` (PATCH: actualizar activa con `priceArs`/`quantity`/`imageUrl`, o cancelar solo con `{ id }`; soporta `listingType: "mystery_pack"` en POST)
- `POST /api/listings/:id/reserve`
- `POST /api/pricing/suggest`
- `POST /api/payments/checkout` (crea checkout Mercado Pago en cuenta del vendedor)
- `POST /api/webhooks/mercadopago` (verifica firma, reconcilia pago y dispara emails)
- `POST /api/payments/verify` (fallback legacy/manual)
- `POST /api/upload/card-image` (multipart campo `file`, max 5 MB)
- `GET /api/cron/release-stale-reservations` (header `Authorization: Bearer CRON_SECRET`)
- `GET,PATCH /api/profile/seller-payment`
- `GET /api/transactions`
- `GET,POST /api/transactions/:id/messages` (chat P2P por transacción; cuerpo POST `{ "body": "..." }`)
- `PATCH /api/transactions/:id/fulfillment`
- `GET,POST /api/disputes`
- `GET /api/catalog/search?q=...&set=...` (proxy TCGdex)
- `GET /api/catalog/sets` (lista sets para filtrar)
- `GET,POST,DELETE /api/watchlist`
- `GET,PATCH /api/notifications`

## Project Structure

```text
app/
	(auth)/
	(dashboard)/
	(public)/
	api/
components/
lib/
	domain/
	server/
	pricing/
	reputation/
supabase/
	schema.sql
```

## Learn More

Useful docs:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Supabase Docs](https://supabase.com/docs) - auth, database, storage and RLS.

## Go Live

- See deployment guide: [DEPLOY.md](DEPLOY.md)
- CI for lint/build on GitHub: [.github/workflows/ci.yml](.github/workflows/ci.yml)

## Estrategia de pagos

Ver [PAYMENTS.md](PAYMENTS.md): diseño explicito para NO ser PSP.
La plataforma solo registra evidencia, los pagos van directo entre
comprador y vendedor (Mercado Pago). Incluye disclaimer legal y
checklist de compliance.

## Next Steps

1. Configurar templates de Supabase Auth en produccion (confirmacion y recovery).
2. Agregar carga de evidencia de disputa (Supabase Storage + adjuntos).
3. Crear panel admin para pagos trabados, disputas, usuarios y vendedores verificados.
4. OCR de cartas: capturar foto y usar el catalog_card_id detectado
   para prellenar el formulario.
5. Verificacion de ID del vendedor (badge "verified") con DNI en Storage.
