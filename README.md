# TCG Marketplace AR

Pokemon-first marketplace MVP for semi-vendedores in Argentina.

Current implementation focus:
- Web PWA foundation with Next.js App Router
- Inventory and listing flows with persistent backend
- Supabase Auth real con sesion por cookies
- Hybrid pricing suggestion endpoint
- Payment verification endpoint connected to transaction state
- Post-venta: fulfillment status + dispute workflows
- Supabase schema for beta launch

## Backend Setup (Supabase)

1. Create a Supabase project.
2. Open SQL Editor and run en este orden:
   - [supabase/schema.sql](supabase/schema.sql) (solo si es un proyecto nuevo).
   - [supabase/migrate-v2.sql](supabase/migrate-v2.sql) (columnas de ownership — owner_id, seller_id, buyer_id, etc.).
   - [supabase/migrate-v3.sql](supabase/migrate-v3.sql) (catalogo Pokemon TCG, alertas, notificaciones, mystery packs).
3. Add env vars in local and production:
	- NEXT_PUBLIC_SUPABASE_URL
	- NEXT_PUBLIC_SUPABASE_ANON_KEY
	- SUPABASE_SERVICE_ROLE_KEY
4. Start the app with npm run dev and verifica con `GET /api/health` que `backend.connected` sea `true`.

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
```

## Key Routes

- `/` product landing
- `/login` login real con Supabase Auth
- `/register` registro real con Supabase Auth
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
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/health`
- `GET,POST,PATCH,DELETE /api/inventory`
- `GET,POST,PATCH /api/listings` (soporta `listingType: "mystery_pack"`)
- `POST /api/listings/:id/reserve`
- `POST /api/pricing/suggest`
- `POST /api/payments/verify`
- `GET /api/transactions`
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

1. Activar email templates/confirmacion y recuperacion de password en Supabase Auth.
2. Completar integracion Mercado Pago real (leer estado de pago con su API y
   cerrar loop automatico sin que el comprador tenga que pegar el ID).
3. Agregar carga de evidencia de disputa (Supabase Storage + adjuntos).
4. OCR de cartas: capturar foto y usar el catalog_card_id detectado
   para prellenar el formulario.
5. Verificacion de ID del vendedor (badge "verified") con DNI en Storage.

