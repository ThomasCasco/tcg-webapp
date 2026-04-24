# Deploy MVP (Costo Cero)

Este proyecto puede salir live hoy con Vercel.

## Opcion recomendada: GitHub + Vercel

1. Subi este repo a GitHub.
2. Entra a Vercel y toca Add New Project.
3. Importa el repo.
4. Verifica estos valores:
   - Framework Preset: Next.js
   - Install Command: npm ci
   - Build Command: npm run build
   - Output: .next (normalmente autodetectado)
5. Deploy.
6. Al terminar, Vercel te da una URL publica.

## Paso obligatorio: conectar backend cloud

1. Crea un proyecto en Supabase.
2. Entra a SQL Editor y ejecuta en este orden:
   - [supabase/schema.sql](supabase/schema.sql)
   - [supabase/migrate-v2.sql](supabase/migrate-v2.sql)
   - [supabase/migrate-v3.sql](supabase/migrate-v3.sql)
   - [supabase/migrate-v4.sql](supabase/migrate-v4.sql)
   - [supabase/migrate-v5.sql](supabase/migrate-v5.sql) (Storage `card-images` + `reserved_at`)
   - [supabase/migrate-v6.sql](supabase/migrate-v6.sql) (envío / retiro en publicaciones)
3. En Vercel, agrega estas variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
4. Redeploy en Vercel.

Si no haces esto, la app se muestra pero no guarda datos para usuarios.

## Deploy por CLI (rapido)

1. Instala CLI: npm i -g vercel
2. Login: vercel login
3. Primer deploy: vercel
4. Produccion: vercel --prod

## Checklist antes de publicar

1. npm run lint
2. npm run build
3. npm run test
4. Verifica rutas:
   - /
   - /login
   - /register
   - /inventory
   - /listings
   - /market
5. Verifica API:
   - /api/health
   - /api/inventory
   - /api/listings
   - /api/pricing/suggest
   - /api/payments/verify
   - /api/profile/seller-payment

## Variables de entorno

Carga estas variables en Vercel:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- PAYMENT_PROVIDER
- PAYMENT_WEBHOOK_SECRET
- MERCADO_PAGO_ACCESS_TOKEN
- STRIPE_SECRET_KEY
- CRON_SECRET (opcional; protege el cron que libera reservas sin pago)

### Cron: liberar reservas viejas

Programá en Vercel Cron (o similar) una petición diaria:

`GET https://TU_DOMINIO/api/cron/release-stale-reservations`  
Header: `Authorization: Bearer CRON_SECRET` (mismo valor que la variable de entorno).

Referencia: .env.example

## Recomendacion para salida preliminar

- Publicar esta version como Beta cerrada con backend Supabase conectado.
- Mantener pagos reales manuales/hibridos hasta validar webhooks firmados.
- Activar monitoreo basico con logs de Vercel y endpoint /api/health.
