# TCG Marketplace AR

Marketplace P2P de cartas Pokémon para Argentina. La v0 es solo **compra y venta
de cartas sueltas con Mercado Pago**: el comprador le paga directo a la cuenta
del vendedor (la plataforma no custodia fondos, ver [PAYMENTS.md](PAYMENTS.md)).

- Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage) + Mercado Pago OAuth.
- Subastas, claims, trades y el directorio de perfiles están congelados
  (`lib/shared/features.ts`, `ENABLE_SECONDARY_FORMATS=1` para encenderlos).

## Puesta en marcha

- Producción: seguí [DEPLOY.md](DEPLOY.md) (checklist de lanzamiento v0).
- Local: `npm install`, copiá `.env.example` a `.env.local`, `npm run dev` y
  verificá `GET /api/health`.
- Base nueva: `supabase/schema.sql`, después `supabase/migrate-v*.sql` en orden,
  después `supabase/migrations/` (el lockdown va último).

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
npm run lint && npm run typecheck && npm run test
```

Vitest cubre auth (tokens falsificados), reglas de reserva, comisión,
transiciones de estado, feature flags y utilidades.

## Catalogo de cartas

El catalogo se consume de [TCGdex](https://tcgdex.dev), API publica gratuita y
open source (no requiere API key). Trae imagenes y precios de referencia de
Cardmarket (EUR). Si en el futuro queres datos pagos de USD / graded, se puede
reemplazar el cliente en `lib/server/tcgdex.ts` por uno de Scrydex.

## Rutas principales

- `/` landing · `/market` mercado · `/market/:id` ficha y compra
- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/onboarding` perfil → conectar Mercado Pago → primera carta
- `/inventory` stock y publicación · `/listings` publicaciones
- `/transactions`, `/transactions/:id` compras y ventas (pago, envío, chat, calificación)
- `/disputes`, `/alerts`, `/account`, `/u/:username` (tienda del vendedor)
- `/how-it-works`, `/terms`, `/privacy`

## API

- Auth: `POST /api/auth/{register,login,logout,forgot-password}`, `GET /api/auth/mercadopago` (+ `/callback`)
- `GET /api/health`
- `GET,POST,PATCH,DELETE /api/inventory` · `POST /api/upload/card-image`
- `GET,POST,PATCH /api/listings` (publicar exige Mercado Pago conectado)
- `POST /api/payments/checkout` (preferencia MP en la cuenta del vendedor, vence a los 30 min)
- `POST /api/webhooks/mercadopago` (firma HMAC + reconciliación)
- `PATCH /api/transactions/:id/fulfillment` (`shipped` / `delivered`, validado por rol y estado)
- `POST /api/transactions/:id/cancel` · `POST /api/transactions/:id/rate`
- `GET,POST /api/transactions/:id/messages` (chat)
- `GET,POST /api/disputes` · `GET,POST,DELETE /api/watchlist` · `GET,PATCH /api/notifications`
- `GET /api/catalog/search`, `GET /api/catalog/sets` (proxy TCGdex)
- Cron (`Authorization: Bearer CRON_SECRET`): `/api/cron/daily` y afines
- Admin (`Authorization: Bearer ADMIN_SECRET`): `POST /api/admin/payments/manual-verify`
- Retirados: `POST /api/listings/:id/reserve` (410, era el pago por alias) y `POST /api/payments/verify`

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

## Próximos pasos

Ver `docs/analisis-producto.md` (diagnóstico y plan). Lo más urgente después del
lanzamiento: dominio propio (emails), panel admin para disputas y pagos
trabados, costo de envío dentro del checkout y carrito por vendedor.
