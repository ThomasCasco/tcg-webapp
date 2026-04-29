# Master Roadmap — TCG Marketplace v1

**Fecha:** 2026-04-28
**Owner:** Thomas Casco
**Estado:** Diseño aprobado, pendiente specs por fase

## Contexto

App: marketplace P2P de cartas Pokémon (TCG) para Argentina, Next.js 16 App Router + Supabase + Tailwind v4.

Estado actual: beta funcional con infraestructura de pagos a medias (DB y tipos listos, pero el flujo es manual — el comprador paga afuera y pega el ID de transacción en un formulario), UX/UI fragmentada (dos sistemas de diseño coexistiendo), navegación mobile rota, sin observabilidad, sin emails transaccionales, sin subastas, sin reputación funcional, sin disputas usables.

Objetivo: dejar la app en estado de **producción real** con Mercado Pago automático (comisión 1% de la plataforma), UX mobile-first coherente, subastas, reputación, disputas, y todas las brechas de seguridad/observabilidad cerradas.

## Principios de diseño

1. **Mobile-first absoluto** — cada pantalla se diseña primero para 375px y se escala. No al revés.
2. **Un solo sistema de diseño** — eliminamos `surface-panel`, todo es `.card` con tokens consistentes.
3. **Pagos no-custodiales con automatización total** — la plataforma no toca plata, pero genera el link de pago, recibe webhook, marca verificado, sin intervención manual del usuario.
4. **Una página por entidad** — `/transactions/[txId]` reemplaza los dos formularios sueltos. La URL es el estado.
5. **Comisión transparente** — 1% se muestra al vendedor antes de publicar y antes del cobro.
6. **Sin Stripe en v1** — Argentina-only. Stripe queda para v2 cuando se evalúe internacional.
7. **No bypass de seguridad por velocidad** — webhooks firmados, secrets rotados, RLS estricto.

## Arquitectura de fases

Las fases están ordenadas por dependencia. Fase 0 es bloqueante de todo. Fases 2-4 dependen de Fase 1. Fases 5-6 pueden paralelizarse después de Fase 4. Fase 7 es siempre la última.

```
Fase 0 (cimientos)
   ├── Fase 1 (MP automático)
   │     ├── Fase 2 (página transacción)
   │     ├── Fase 3 (marketplace UX)
   │     └── Fase 4 (onboarding vendedor)
   │           ├── Fase 5 (reputación + disputas)
   │           └── Fase 6 (subastas)
   │                 └── Fase 7 (polish prod)
```

---

## Fase 0 — Cimientos (1 semana)

**Goal:** sistema de diseño unificado, layout mobile-first, primitivos UI, observabilidad, seguridad básica.

**Sin esto:** cada fase posterior pelea contra dos sistemas de diseño y un nav roto.

### Scope IN
- Borrar `.surface-panel`. Migrar todo a `.card` o variantes (`.card-interactive`, `.card-muted`).
- Tokens de diseño: escala tipográfica (h1-h4 + body + caption), spacing (4/8/12/16/24/32/48), radius (sm/md/lg/full), shadows (sm/md/lg).
- Layout dashboard: bottom nav fija (5 items: Mercado, Inventario, Mis Ventas, Compras, Cuenta), sticky header con título de página y back button, drawer hamburguesa para items secundarios.
- Layout público: header sticky simple con logo + buscar + login.
- Primitivos: `<Modal>`, `<Sheet>` (drawer mobile), `<Toast>`, `<Skeleton>`, `<FormField>` (label + input + error + hint), `<Button>` (variants + sizes + loading state), `<Chip>`.
- Sentry integrado (errores cliente + servidor).
- Structured logging con request ID.
- CSP header. Rate limit en `/api/catalog`.
- Rotar las keys de Supabase expuestas en `.env.local`. Borrar de git history.
- Borrar emojis decorativos (📇🛒🏷️) — reemplazar con set de íconos consistente (lucide-react).

### Scope OUT
- No cambiamos features. Solo presentación.
- No agregamos páginas nuevas.

### Acceptance
- Lighthouse mobile > 85 en homepage y `/market`.
- Todos los componentes existentes renderizan con tokens unificados (visual diff manual).
- Sentry recibe errores de prueba.
- `gh secret list` no muestra keys hardcodeadas.

---

## Fase 1 — Mercado Pago automático + comisión 1% (1-2 semanas)

**Goal:** flujo de pago end-to-end sin que nadie pegue IDs a mano.

### Scope IN
- App registrada en MP Developers. Vendedor conecta su cuenta MP vía OAuth desde "Cuenta → Cobros".
- Tabla `seller_mp_credentials` con access_token, refresh_token, mp_user_id, expira_en, encriptados con `SUPABASE_VAULT` o columna encrypted.
- Endpoint `POST /api/payments/checkout` que recibe `listing_id`, valida stock, crea preferencia MP en cuenta del vendedor con `marketplace_fee=precio*0.01`, redirige a `init_point`.
- Endpoint `POST /api/webhooks/mercadopago` que valida firma HMAC con `MP_WEBHOOK_SECRET`, busca pago, marca `payment_events.verification_status='verified'`, transiciona listing a `sold`.
- Cron `release-stale-reservations` cada 15 min: libera listings con `reserved_at < now() - 24h` que no tengan pago verificado.
- Refresh automático de tokens MP (cron diario o lazy en cada uso).
- Emails transaccionales con Resend: pago confirmado al comprador, venta confirmada al vendedor, payout disponible al vendedor.
- Admin endpoint `POST /api/admin/payments/manual-verify` (sólo rol admin) como fallback. Borrar `PaymentVerifyForm` del UI público.
- Mostrar comisión 1% en formulario de publicación: "Vas a cobrar $X. Comisión plataforma: $Y. Mercado Pago descuenta su comisión adicional según tu plan."

### Scope OUT
- KYC del vendedor (queda para Fase 5 con badge de verificación).
- Refunds automáticos (queda en disputa manual de Fase 5).
- Stripe (v2).

### Acceptance
- Comprador puede comprar end-to-end sin escribir nada manual.
- Webhook de MP firma validada, rechaza requests sin firma.
- Plataforma recibe el 1% en su cuenta MP.
- Email llega a comprador y vendedor.
- Reserva expira a las 24h si no hay pago.
- Test E2E: reservar → pagar (MP sandbox) → webhook → estado verified → email.

---

## Fase 2 — Página de transacción unificada (1 semana)

**Goal:** una URL canónica por transacción con todo el contexto.

### Scope IN
- Ruta `/transactions/[txId]` con SSR + RLS check (sólo buyer o seller).
- Tabs: Resumen | Chat | Disputa.
- Resumen: datos del listing, montos, estado pago, estado envío, datos de envío del vendedor (con copy-to-clipboard), tracking si existe.
- Acciones contextuales por rol: vendedor ve "Marcar como enviado" (con input de tracking), comprador ve "Confirmar recibido" después de shipped.
- Chat embebido (componente existente refactor).
- Disputa: link a "Abrir disputa" si transacción en estado problemático.
- Lista `/transactions` rediseñada: cards clickeables, filtros por estado (compras/ventas), sin formularios.
- Borrar `PaymentVerifyForm` y `TransactionFulfillmentForm` del header de `/transactions`.

### Acceptance
- Cero inputs de "transaction ID" en UI público.
- Todo cambio de estado se hace desde la página de detalle.
- Mobile: acciones primarias en sticky bar abajo.

---

## Fase 3 — Marketplace UX (1 semana)

**Goal:** descubrimiento y conversión optimizados para mobile.

### Scope IN
- `/market`: header sticky con buscador + sort dropdown. Botón "Filtros" abre `<Sheet>` (drawer mobile / modal desktop) con todos los filtros + chips activos en la barra.
- Búsqueda con autocomplete contra catálogo TCGDex (debounce 300ms).
- `/market/[id]`: imagen full-width arriba, sticky CTA "Comprar ahora $X" abajo en mobile, info de vendedor con reputación visible (estrella + ventas).
- Sugerencia de precio al publicar: muestra precio TCGDex y rango de mercado local.
- Card de listing con badge de "envío" o "pickup".
- Empty states con ilustración y CTA.

### Acceptance
- En 375px: filtros abren con un tap, no scrollean en línea.
- Buscar "charizard" muestra autocomplete en menos de 500ms.
- Sticky CTA visible siempre en `/market/[id]` mobile.

---

## Fase 4 — Onboarding vendedor + inventario (1 semana)

**Goal:** un vendedor nuevo publica su primera carta en menos de 5 minutos.

### Scope IN
- Wizard de onboarding post-registro: 1) bienvenida, 2) conectar MP (Fase 1), 3) datos de envío, 4) primer item.
- CardPicker rediseñado: un solo input con autocomplete contra TCGDex (no más doble dropdown anidado).
- Inventario → Publicar en un único `<Modal>`: precio, condición, stock, opciones de envío, todo en un step.
- Eliminar el acordeón inline de InventoryEntryCard.
- Mostrar comisión 1% pre-publicación.
- Borrar página huérfana `/catalog/[cardId]` o convertirla en redirect a `/market?q=<cardName>`.

### Acceptance
- Tiempo registro → primer listing publicado < 5 min en mobile.
- CardPicker responde con sugerencias en < 300ms.

---

## Fase 5 — Reputación + Disputas reales (1 semana)

**Goal:** confianza P2P y resolución de problemas.

### Scope IN
- Tabla `reputation_events` (transaction_id, rated_user_id, rater_user_id, score 1-5, comment, created_at).
- Vista materializada `user_reputation` con avg_score, total_ratings, total_sales.
- UI: rating obligatorio post-transacción (after `delivered` confirmed) — modal en `/transactions/[txId]`.
- Mostrar reputación en card de listing, perfil de vendedor, header de transacción.
- Disputas con estados: open → mediation → resolved_buyer | resolved_seller | rejected.
- Página `/disputes/[id]` (no la lista actual). Permite respuesta del contraparte, upload de evidencia (Supabase Storage), historial.
- Notificación in-app + email cuando hay actividad en disputa.
- Badge "Vendedor verificado" — al principio admin lo otorga manual desde `/admin/users`.

### Acceptance
- Comprador y vendedor pueden ratear post-entrega.
- Score se calcula y muestra correctamente.
- Disputa permite ida-y-vuelta con evidencia.

---

## Fase 6 — Subastas (2 semanas)

**Goal:** vender cartas raras a precio de mercado real.

### Scope IN
- Nuevo tipo de listing: `auction` (vs `fixed_price` actual).
- Tablas `auction_listings` (listing_id, starts_at, ends_at, min_bid, current_bid, current_bidder_id, bid_increment) y `bids` (auction_id, bidder_id, amount, created_at).
- Anti-snipe: cualquier puja en los últimos 5 min extiende el remate 5 min.
- Listado de subastas en `/market?type=auction` con timer en vivo (client-side countdown).
- Página de subasta con historial de pujas (solo amounts, no IDs), input de puja con validación (mínimo current_bid + increment).
- Push/email cuando te superan o ganás.
- Cron `close-auctions` cada minuto: cierra subastas vencidas, crea `payment_event` para el ganador, dispara flujo MP de Fase 1.
- Política: no se puede cancelar puja. Vendedor no puede pujar en su propia subasta. Bloqueo si comprador no tiene reputación mínima (configurable).

### Acceptance
- Subasta termina puntual con extensión por anti-snipe correcta.
- Ganador recibe email con link de pago MP.
- Pujas concurrentes no causan condiciones de carrera (lock en DB).

---

## Fase 7 — Polish para producción (1 semana)

**Goal:** salir a prod sin sorpresas.

### Scope IN
- SEO: `app/sitemap.ts` con listings activos, `app/robots.ts`, metadata dinámica por `/market/[id]` con OG image generada.
- Performance: migrar todo a `next/image`, cache headers en endpoints públicos, bundle analyzer en CI.
- Tests: smoke tests de auth, pagos (MP sandbox), listings, transacciones. Vitest + Playwright para E2E crítico.
- CI completa: lint + typecheck + test + build. Bloquea merge si fallan.
- Email verification y password recovery (Supabase Auth templates configurados).
- Documentación de runbook: cómo monitorear, cómo responder a un webhook fallido, cómo procesar refund manual.
- Backups de Supabase configurados y verificados.

### Acceptance
- Lighthouse mobile > 90 en todas las páginas críticas.
- Tests E2E pasan en CI.
- Email verification y password reset funcionan.
- Equipo tiene runbook escrito.

---

## Modelo de ejecución

### Lo que se puede paralelizar y lo que no

- **Fase 0 NO se paraleliza.** Toca todo el codebase (tokens, layout, primitivos). Un solo agente o session.
- **Fase 1 NO se paraleliza internamente.** Toca DB, OAuth, webhook, emails — todo está acoplado. Pero **mientras Fase 1 se hace, otro agente puede trabajar en Fase 2** (es UI sobre datos que ya existen).
- **Fases 2, 3, 4** sí se paralelizan entre sí después de Fase 1 (tocan archivos distintos: `/transactions/*`, `/market/*`, `/inventory/*` + onboarding).
- **Fases 5 y 6** se paralelizan entre sí después de Fase 4.
- **Fase 7** es secuencial al final.

### Ritmo realista

- Total: 8-9 semanas si una sola persona codea full-time.
- Con 2-3 agentes paralelos en fases compatibles: 5-6 semanas.
- Cada fase necesita su spec escrito antes de codear (spec → plan → ejecución).

### Próximos pasos inmediatos

1. Usuario aprueba este master roadmap.
2. Escribo spec detallado de **Fase 0**.
3. Usuario aprueba spec de Fase 0.
4. `superpowers:writing-plans` genera plan paso a paso.
5. Ejecutamos Fase 0 con `superpowers:executing-plans` (single-threaded por su naturaleza).
6. Mientras Fase 0 termina, escribo spec de Fase 1.
7. Loop: spec → plan → ejecución por fase. Donde es paralelizable, dispatch subagentes.

## Decisiones abiertas (asumidas pendiente confirmación del usuario)

- "Claims" interpretado como **disputas/reclamos** (Fase 5). Si era otra cosa, ajustar.
- Sin Stripe en v1.
- Comisión fija 1%. Configurable por env var `PLATFORM_FEE_PERCENT` por las dudas.
- Resend como email provider. Alternativa: Supabase email.
- Lucide-react como icon set.
- Subastas IN para v1 (usuario dijo "todo terminado antes de lanzar").
