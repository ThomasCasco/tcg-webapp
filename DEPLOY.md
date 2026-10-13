# Lanzamiento v0

Checklist para poner la v0 en producción sin dominio propio y sin contrato
comercial con Mercado Pago. Seguilo en orden; cada paso dice dónde se hace.

La v0 es solo **compra y venta de cartas sueltas con Mercado Pago**. Subastas,
claims, trades y el directorio de perfiles están congelados (ver
`lib/shared/features.ts`).

---

## 1. Base de datos (Supabase) — ya hecho en `tcg-arg-123`

- [x] Migración `supabase/migrations/20261013000001_v0_lockdown.sql`: RLS en todas
  las tablas y sin políticas para la clave pública (la app usa la service role).
- [x] Columna `inventory_entries.back_image_url`.

En un proyecto nuevo: `supabase/schema.sql`, después todos los
`supabase/migrate-v*.sql` en orden, después los archivos de
`supabase/migrations/`. El lockdown va **último** (borra políticas creadas antes).

## 2. Supabase Auth (dashboard → Authentication)

- [ ] **URL Configuration**: *Site URL* = la URL de producción de Vercel (paso 4).
  Agregá la misma en *Redirect URLs*.
- [ ] **Providers → Email → Confirm email: desactivado** mientras no tengas
  dominio. El SMTP que trae Supabase manda muy pocos mails por hora y frena los
  registros; sin confirmación, la gente entra apenas se registra. Reactivalo
  cuando configures un SMTP propio (paso 7).
- [ ] **Attack Protection → Leaked password protection**: activado.

## 3. Mercado Pago (developers.mercadopago.com.ar → Tus integraciones)

No hace falta contrato comercial: el cobro con OAuth y `marketplace_fee` es
autoservicio.

- [ ] Abrí la aplicación (o creá una de tipo *Checkout Pro*) y usá las
  **credenciales de producción**.
- [ ] **Redirect URL de OAuth**: `https://<tu-url>/api/auth/mercadopago/callback`.
- [ ] **Webhooks**: URL `https://<tu-url>/api/webhooks/mercadopago`, evento
  *Pagos*. Copiá la clave secreta → `MP_WEBHOOK_SECRET`.
- [ ] Antes de abrir al público, hacé una compra real chica entre dos cuentas
  tuyas (paso 6).

## 4. Vercel (proyecto `tcg-webapp`)

- [ ] **Settings → Deployment Protection**: que **producción sea pública**. Hoy
  pide login de Vercel; así nadie puede entrar.
- [ ] Anotá la URL de producción (`https://<proyecto>.vercel.app`). Esa es tu
  `APP_URL` hasta tener dominio.
- [ ] **Settings → Environment Variables (Production)**:

| Variable | Valor |
|---|---|
| `APP_URL` | `https://<proyecto>.vercel.app` (con https) |
| `NEXT_PUBLIC_APP_URL` | igual que `APP_URL` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | clave service role |
| `MP_APP_ID`, `MP_CLIENT_SECRET`, `MP_ACCESS_TOKEN` | credenciales de producción de MP |
| `MP_REDIRECT_URI` | `https://<proyecto>.vercel.app/api/auth/mercadopago/callback` |
| `MP_WEBHOOK_SECRET` | la clave del webhook de MP |
| `CRON_SECRET`, `ADMIN_SECRET` | dos valores largos al azar (`openssl rand -hex 32`) |
| `PLATFORM_FEE_PERCENT` | `0` durante el lanzamiento |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | tu email de contacto para disputas |
| `RESEND_API_KEY`, `EMAIL_FROM` | opcionales hasta tener dominio (paso 7) |
| `ENABLE_SECONDARY_FORMATS` | no la cargues |

Borrá variables viejas que ya no se usan: `PAYMENT_PROVIDER`,
`PAYMENT_WEBHOOK_SECRET`, `MERCADO_PAGO_ACCESS_TOKEN`, `STRIPE_SECRET_KEY`.

- [ ] Hacé merge de la rama a `main` y esperá el deploy. Sin `APP_URL` en https
  o sin las variables de MP/Supabase, el arranque falla a propósito
  (`lib/server/env-validate.ts`).

**Plan de Vercel**: Hobby no permite uso comercial. Mientras la comisión sea 0
alcanza para probar; pasá a Pro antes de cobrar comisión.

## 5. Verificación rápida

- [ ] `GET https://<tu-url>/api/health` responde `backend.connected: true`.
- [ ] `/auctions` redirige a `/market` (formatos congelados).
- [ ] Desde el celular: el header muestra "Ingresar" y la búsqueda.

## 6. Prueba de punta a punta (con dos cuentas tuyas)

1. Cuenta A: registrarse → onboarding → conectar Mercado Pago → cargar una
   carta con foto → publicar con un precio bajo.
2. Cuenta B (otro navegador): registrarse → buscar la carta → "Comprar con
   Mercado Pago" → pagar con una tarjeta real.
3. Volver a la app: la operación debe decir "Pago acreditado" en segundos. Si
   no, revisá la tabla `mp_webhook_events` en Supabase.
4. Cuenta A: "Marcar enviado" con un tracking (o "Ya la entregué en persona").
5. Cuenta B: "Ya tengo la carta" → calificar. La operación queda cerrada.
6. Devolvé el pago desde la cuenta de MP de A si no querés que quede la venta.

## 7. Cuando tengas dominio (recomendado pronto)

Un dominio propio (por ejemplo `.com.ar` en NIC Argentina) destraba:

- **Emails a usuarios**: verificá el dominio en Resend y poné
  `EMAIL_FROM="TCG <no-responder@tu-dominio>"`. Sin dominio, Resend solo entrega
  a la casilla del dueño de la cuenta y la app usa solo notificaciones internas.
- **SMTP propio en Supabase Auth** (con Resend) → reactivar *Confirm email*.
- Actualizar `APP_URL`, `NEXT_PUBLIC_APP_URL`, `MP_REDIRECT_URI`, la Redirect
  URL y el webhook en Mercado Pago, y la Site URL de Supabase.

## Operación diaria

- **Cron**: `vercel.json` corre `/api/cron/daily` una vez por día (reconcilia
  pagos y refresca tokens de MP). Las reservas vencidas no dependen del cron: se
  liberan solas a los 35 minutos.
- **Pago trabado** (el comprador pagó y no se acreditó): `POST
  /api/admin/payments/manual-verify` con `Authorization: Bearer $ADMIN_SECRET` y
  `{ "transactionId": "...", "mpPaymentId": "..." }`. Primero revisá
  `mp_webhook_events`.
- **Disputas**: llegan como notificación a la otra parte; por ahora se resuelven
  a mano por email (`NEXT_PUBLIC_SUPPORT_EMAIL`).
- **Volver a encender formatos**: `ENABLE_SECONDARY_FORMATS=1` (antes leé las
  notas de `lib/shared/features.ts`).
