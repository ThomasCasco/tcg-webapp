# TCG.ar: diagnóstico de producto y plan para terminarla

**Fecha:** 13-10-2026 · **Alcance:** repo `ThomasCasco/tcg-webapp` (rama `main`, último commit 20-05-2026) + base de producción en Supabase (solo lectura, conteos agregados) + investigación de mercado.
**Perfiles combinados:** PM de marketplaces, estrategia de negocio, UX/UI, tech lead.

> El pedido original llegó cortado en "Retención: qué hace volver al usuario (alertas, watchlist, follow, notificaciones,". Completé retención y agregué lo que suele seguir en este tipo de pedido: diagnóstico técnico, plan priorizado, métricas y preguntas abiertas.

## Cómo se hizo este análisis (y qué no se pudo)

| Fuente | Qué se hizo | Límite |
|---|---|---|
| Docs | `CLAUDE.md`, `README.md`, `PAYMENTS.md`, `DEPLOY.md`, specs de `docs/superpowers/`, `supabase/schema.sql` y las 17 migraciones | — |
| Código | Lectura de `app/`, `components/`, `lib/` con foco en el flujo de compra, pagos, auth y estados | — |
| Calidad | `npm run lint`, `typecheck`, `test`, `next build` | Lint: 0 errores, 1 warning. Typecheck OK. **46/46 tests pasan.** Build OK. |
| App corriendo | Build de producción local, **sin backend** (Supabase apuntando a un host muerto). 10 capturas a 375×812 y auditoría automática de tamaños de toque y labels | Las pantallas con datos muestran estados vacíos o de error. Los flujos con datos (ficha, checkout, transacción) se **infieren del código** y están marcados **[código]** |
| Lighthouse | Mobile, sobre `/how-it-works` y `/login` (páginas estáticas) | Mercado y home dependen del backend: no son medibles así |
| Producción | `tcg.ar` y el deploy de Vercel del repo; Supabase de producción con consultas de conteo (sin datos personales) | El deploy de Vercel está detrás de SSO: no se pudo recorrer la app real |
| Mercado | Búsqueda web: competidores locales, tarifas de MP y ML, jurisprudencia, aduana | No encontré tamaños de grupos de Facebook/WhatsApp por búsqueda: queda como hipótesis a validar con entrevistas |

---

## 0. Resumen ejecutivo

**Veredicto:** la app tiene mucha superficie construida en un mes (abril-mayo 2026) y una base técnica prolija (CI, logs, validación de entorno, reconciliación de pagos con varias redes de seguridad). Pero **no está lista para usuarios reales** y el problema principal no es de código: **es de foco y de confianza**. Hay seis formatos de venta para cero usuarios activos, y ya existe un competidor local que ocupa exactamente el mismo posicionamiento con más de mil publicaciones.

**Los 6 hallazgos que cambian el plan:**

1. **El producto no está en uso.** Producción tiene 4 usuarios, 0 activos en los últimos 30 días, 6 publicaciones activas, 3 pagos verificados, 0 entregas confirmadas y ARS 20 de comisiones cobradas en total. La última actividad es del 14-05-2026 y el repo no se toca desde el 20-05-2026.
2. **`tcg.ar` no sirve este repo.** El dominio responde con otra aplicación (SPA de Vite, título "TCG", tema claro, sin `/api/health`). La app de este repo se llama "TCG Marketplace AR" en metadata, emails y el descriptor de Mercado Pago, y "TCG.ar" solo en el logo.
3. **Hay tres fallas de seguridad que permiten fraude directo** y bloquean cualquier lanzamiento:
   - **Suplantación de cualquier cuenta:** la sesión se lee del JWT **sin verificar la firma** (`lib/server/auth.ts:133`). Cualquiera puede armar una cookie con el `sub` de otro usuario (los IDs salen en `GET /api/listings`) y operar como esa persona, por ejemplo cambiar su alias de cobro. Lo verifiqué localmente con un token con firma falsa: lo acepta. No lo probé contra producción.
   - **"Pago verificado" falsificable:** `POST /api/payments/verify` acepta cualquier ID de pago aprobado de Mercado Pago sin comprobar monto, vendedor ni referencia (`app/api/payments/verify/route.ts:108`). El comprador puede reusar el ID de una compra barata anterior y la publicación queda "vendida" y "pagada".
   - **Datos personales expuestos y auto-edición de flags:** la política RLS de `profiles` deja leer WhatsApp, alias/CBU e ID de MP de todos los usuarios con la clave pública, y deja que cada usuario edite su propio `mp_connected` y `account_status` (confirmado en producción). Un estafador puede mostrarse como "Mercado Pago automático" sin tenerlo.
4. **El flujo de compra puede vender dos veces la misma carta** (preferencias de MP sin vencimiento + liberación de reservas + marcado como "vendida" sin condición), y vende la publicación entera aunque tenga varias unidades.
5. **El negocio se fuga por diseño:** el onboarding empuja a cargar alias/CBU (comisión 0) y deja MP para "después". Subastas, claims y trades no pasan por el checkout: ninguno cobra comisión.
6. **La competencia ya está adelante:** Cartealo (Pokémon, Argentina, pesos, reputación por rangos, fondos retenidos hasta confirmar) muestra 1.150 publicaciones activas. Card Stash ofrece MP con 72 h de disputa. La propuesta actual de TCG.ar no tiene un diferencial claro frente a ellos.

**Recomendación en una línea:** congelar todo lo que no sea "comprar y vender una carta suelta con Mercado Pago", arreglar seguridad y pagos, elegir un diferencial defendible (el más barato y rápido para cobrar, con la confianza mejor resuelta de AMBA) y lanzar cerrado con 20-30 vendedores sembrados a mano.

**Plan en 4 fases** (detalle en §6): decidir y validar (1 semana) → seguridad y pagos correctos (2 semanas) → recortar y cerrar el flujo core (3 semanas) → lanzamiento cerrado en AMBA (4-6 semanas de operación). Con una persona a tiempo completo son unas 6 semanas de desarrollo; a media jornada, el doble.

---

## Estado real (dato duro, no estimado)

Consulta de solo lectura a la base de producción (`tcg-arg-123`, sa-east-1) el 13-10-2026:

| Métrica | Valor |
|---|---|
| Usuarios registrados / con email confirmado | 4 / 4 |
| Usuarios con login en los últimos 30 días | **0** |
| Onboarding completado | 0 |
| Vendedores con MP conectado | 2 |
| Cartas en inventario (dueños) | 3 (1 usuario) |
| Publicaciones totales / activas / vendidas | 10 / 6 / 2 |
| Transacciones / pagos verificados / entregadas o cerradas | 3 / 3 / **0** |
| Comisiones cobradas (suma de `platform_fee_ars` verificadas) | **ARS 20** |
| Subastas, claims, propuestas de trade, disputas, calificaciones, watchlists | 0 en todos |
| Eventos de webhook MP | 11 (resultados: verified, blocked, ignored) |
| Primer usuario / último usuario / última publicación / última transacción | 22-04 / 14-05 / 14-05 / 14-05 (2026) |

Lectura: son cuentas de prueba del desarrollo. **No hay tracción que proteger**, lo que es una ventaja: se puede recortar sin costo.

**Drift entre repo y producción** (importa para el plan técnico):
- Producción tiene tablas que no están en el repo: `conversations`, `conversation_reads`, `messages`, `reports`.
- La migración `supabase/migrations/20260516000001_back_image_url.sql` **no está aplicada** en producción, pero `createInventoryEntry` siempre inserta `back_image_url` (`lib/server/repository.ts:955`). Si `main` está desplegado, **es probable que hoy nadie pueda cargar cartas al inventario** en producción. No lo pude confirmar porque el deploy está detrás de SSO.
- En el repo, las tablas principales (`market_listings`, `payment_events`, `inventory_entries`, chat, notificaciones, disputas) **no tienen RLS habilitado**. En producción sí lo tienen, sin políticas (todo cerrado salvo service role). Una instalación nueva desde el repo quedaría abierta.

---

## Contradicciones entre el contexto, los docs y el código

| Tema | Contexto / docs dicen | El código hace |
|---|---|---|
| Nombre y dominio | "TCG.ar" | Metadata, manifest, emails y `statement_descriptor` de MP dicen "TCG Marketplace AR". `tcg.ar` sirve otra app. |
| Comisión | Roadmap: 1% fijo. `PAYMENTS.md`: "$500 ARS por transacción". | `PLATFORM_FEE_PERCENT` (default 1) en checkout, webhook y página de transacción, con mínimo de ARS 1. Además está **hardcodeado** en 1% en `components/inventory-entry-card.tsx:156` y en el email (`lib/server/email.ts:150`, "Comisión plataforma (1 %)"). Si cambiás la variable, la UI y el email mienten. En operaciones P2P (sin MP) se le muestra al vendedor una comisión que nunca se cobra. |
| Mystery packs | "Existen" | **Pausados:** la API devuelve 410 (`app/api/listings/route.ts:125`), están filtrados del mercado y su ficha da 404. |
| Sugerencia de precio | "Existe" | **No existe.** El README lista `POST /api/pricing/suggest` y `lib/pricing/`: ninguno existe. Solo se muestra la referencia de Cardmarket en EUR, sin convertir. |
| Reserva de 24 h | Copy de la ficha y de "Cómo funciona" | La reserva se libera a los **30 minutos**, pero el único cron corre **una vez por día** a las 06:00 UTC (`vercel.json`, `app/api/cron/daily/route.ts:67`). En la práctica dura entre 30 min y 24 h según la hora. |
| Claims | Roadmap: "Claims = drops programados" (lote con horario, preview y primer comprador gana) | Se implementó otra cosa: **sesiones de claim en vivo** (el vendedor revela cartas una por una). Los drops no existen. |
| Subastas | "Cómo funciona": "Pago igual que el marketplace" | Falso: el checkout de MP exige `listingId`. La transacción de subasta se crea con `listing_id = null` y por eso **no puede pasar a enviado, entregado ni disputa** (`updateFulfillmentStatus` busca el vendedor en la publicación). |
| Verificación del vendedor | Pendiente según README | La UI muestra "MP conectado" con ícono de escudo, que se lee como verificación. |
| Onboarding | Roadmap: bienvenida → conectar MP → envío → primer ítem | Perfil → alias/CBU como `bank_transfer` → fin. No conecta MP, no carga carta. Después del registro se redirige a `/inventory` (`components/register-form.tsx:56`): el wizard solo aparece si el usuario entra a `/dashboard`. |
| Navegación inferior | Roadmap: Mercado, Inventario, Mis ventas, Compras, Cuenta | Mercado, Trades, Inventario, Ventas. **No hay acceso a Compras.** |
| Promesas de `PAYMENTS.md` | Cierre automático a los 7 días; suspensión automática por disputas; "hold informal" | Nada de eso está implementado. `account_status = suspended` no bloquea nada. |
| `DEPLOY.md` | Variables `PAYMENT_PROVIDER`, `STRIPE_SECRET_KEY`, `MERCADO_PAGO_ACCESS_TOKEN`; migraciones hasta v6 | Desactualizado. Las variables reales son `MP_*`, y hay migraciones hasta v15 más tres con timestamp. |
| Modelo de datos | `schema.sql` como fuente de verdad | `schema.sql` mezcla dos modelos paralelos (`inventory_cards`/`listings`/`transaction_events`, que no usa nadie, y `inventory_entries`/`market_listings`/`payment_events`, que es el real) y no incluye las migraciones posteriores. |
| Modelo de confianza de auth | `CLAUDE.md`: "decodificar sin verificar es intencional, igual que `getSession()`" | Es incorrecto: que la cookie sea httpOnly impide que un script la **lea**, no que el usuario la **escriba**. La propia documentación de Supabase pide no confiar en `getSession()` en el servidor. |

---

## 1. La idea, reformulada

> **TCG.ar es un mercado en pesos para comprar y vender cartas sueltas de Pokémon entre coleccionistas de Argentina.** Está pensado para el "semi-vendedor": alguien que vende parte de su colección o revende a pequeña escala y hoy lo hace en grupos de Facebook, WhatsApp e Instagram. Resuelve tres dolores de esos canales: no saber si la otra persona es confiable, cobrar sin capturas de transferencia truchas y poner precio sin investigar a mano en Cardmarket. La promesa: publicás desde un catálogo en minutos, el comprador te paga por Mercado Pago a tu propia cuenta (no a un alias de un desconocido) y cada operación queda registrada en una reputación que no se puede inventar. Frente a Facebook ofrece menos estafas y menos idas y vueltas. Frente a Mercado Libre, una comisión mucho menor y un catálogo pensado para TCG (set, número, condición).

**Se puede escribir claro, pero tiene dos problemas:**
- **El "por qué cambiarse" no está en el producto.** La protección contra estafas hoy es "revisá la reputación y guardá el comprobante" (y la reputación es falsificable por los bugs de §5). El precio sugerido no existe.
- **No diferencia frente a Cartealo**, que dice lo mismo, tiene más oferta y ya retiene el pago hasta que el comprador confirma. El diferencial posible de TCG.ar (comisión más baja y cobro inmediato) **choca con la confianza**: sin retención de fondos, el comprador asume el riesgo. Hay que elegir conscientemente (ver §2.5).

---

## 2. Negocio

### 2.1 Cómo se compra y vende hoy, y por qué alguien migraría

| Canal | Cómo funciona | Dolor | Fuente / nivel de certeza |
|---|---|---|---|
| Grupos de Facebook y Marketplace | Publicación con foto, arreglo por Messenger, pago por transferencia | Estafas por transferencia y por identidad robada, sin supervisión, falsificaciones | Patrones documentados globalmente ([Bitdefender](https://www.bitdefender.com/es-es/blog/hotforsecurity/estafas-con-cartas-pokemon-2026), [Pokémon Price Tracker](https://www.pokemonpricetracker.com/guides/avoiding-pokemon-card-scams)) y un caso local con figuritas en Buenos Aires ([WeLiveSecurity](https://www.welivesecurity.com/la-es/2022/10/25/estafadores-venden-figuritas-marketplace-utilizando-nombre-direccion-comercios-legitimos/)). No encontré el tamaño de los grupos argentinos: **validar con entrevistas.** |
| WhatsApp, Instagram, Discord | Vendedores con audiencia propia: historias, "claims" en vivo, listas de precios | Sin registro, sin reputación portable, todo depende del vendedor | Hipótesis basada en cómo está diseñada la feature de claims del repo. **Validar.** |
| Mercado Libre | Publicación clásica o premium | Comisión de ~12-15% más IVA y costo fijo en tickets bajos (fuente secundaria: [guía 2026](https://app.spomsolutions.com/blog/comisiones-mercadolibre-guia-2026)). Sin catálogo TCG ni condición estandarizada. | Fuente secundaria |
| Tiendas y torneos locales | Compra en mano en ligas, carpetas, eventos oficiales | Liquidez limitada a la ciudad. El Special Championship de Buenos Aires agotó cupos rápido, lo que muestra demanda competitiva concentrada ([Cultura Geek](https://culturageek.com.ar/pokemon-special-championships-buenos-aires-2026-agoto-en-tiempo-record-todos-los-cupos-para-la-competencia/), [Victory Road](https://victoryroad.pro/2026-buenos-aires)) | Media |
| **Competidores locales directos** | **[Cartealo](https://cartealo.com/):** solo Pokémon, pesos, 1.150 publicaciones activas en el home, reputación Bronce→Diamante, comisión al vendedor de 5% a 6,75% más 2,5% al comprador si paga con MP, billetera en USD y "el vendedor cobra cuando confirmás" ([comisiones](https://cartealo.com/comisiones), [cómo funciona](https://cartealo.com/como-funciona)). Su "Compra protegida" con verificación física está "en camino". **[Card Stash](https://cardstash.ar/):** Magic, Pokémon y One Piece, MP, comisión de ~3,4% más la de MP, disputa de 72 h, órdenes de compra e historial de precios. También aparecen [MiEspacioTCG](https://miespaciotcg.com/) y [TCG FANS](https://tcg.fans/pokemon/about-us). | Ya resuelven parte del problema | Alta (sitios propios) |
| Internacionales | Cardmarket, TCGplayer, CardTrader | Importar implica courier, ARCA y dólar. El régimen cambió con las RG 5883 y 5884/2026 ([KPMG](https://kpmg.com/us/en/taxnewsflash/news/2026/07/argentina-updated-postal-shipment-rules-courier-regime.html)) | Media |

**¿Por qué migraría alguien?** En un marketplace P2P la gente se muda por **liquidez** (dónde están las cartas y los compradores), no por features. Con 6 publicaciones nadie migra. Las razones que sí mueven:
- **Vendedor:** vender más rápido o a mejor precio neto que en ML, cobrar sin perseguir transferencias y tener una reputación que lo ayude a vender caro.
- **Comprador:** encontrar la carta exacta (set, número, idioma, condición) y **no perder plata**.

Hoy TCG.ar no gana en ninguno de los cuatro frente a Cartealo.

### 2.2 Segmentos y arranque en frío

| Segmento | Qué necesita | Disposición a pagar | Rol al arrancar |
|---|---|---|---|
| **Semi-vendedor** (vende su colección o revende poco) | Publicar rápido, precio sugerido, cobrar seguro | Baja: compara con vender gratis por Facebook | **Oferta núcleo.** Es el segmento objetivo. |
| Coleccionista comprador | Encontrar la carta exacta, fotos reales, no ser estafado | Media: paga algo por seguridad | Demanda núcleo |
| Jugador competitivo | Singles del meta rápido y barato, en lote (mazo completo) | Media; sensible al precio | Demanda de volumen y ticket bajo: necesita carrito |
| Tienda local / revendedor | Canal extra, gestión de stock, pagos | Alta si le genera ventas | **Ancla de oferta** y punto físico de entrega |

**El lado difícil al principio es la oferta.** El semi-vendedor ya vende gratis en Facebook o Instagram con su audiencia; solo se muda si ve compradores. El comprador, en cambio, llega solo si hay inventario y confianza. Después de arrancar, el lado difícil pasa a ser **retener la demanda** (que vuelva a comprar).

**Plan de arranque en frío recomendado:**
1. **Una geografía:** AMBA, para que el retiro en persona y los puntos de entrega funcionen desde el día uno.
2. **Un nicho:** singles de Pokémon del formato estándar vigente más "chase cards" de sets recientes. Es donde hay rotación y búsqueda por carta exacta.
3. **Oferta sembrada a mano:** reclutar 20-30 vendedores (semi-vendedores activos de los grupos y 3-5 tiendas), **cargarles el inventario nosotros** (concierge) y darles 0% de comisión los primeros 90 días o las primeras 20 ventas. Objetivo: más de 500 publicaciones antes de abrir la demanda.
4. **Darle al vendedor una herramienta, no solo un mercado:** un link de tienda (`tcg.ar/u/usuario`) para compartir en Instagram y WhatsApp, donde su propia audiencia paga con MP y protección. Así la desintermediación se da vuelta: **el vendedor trae compradores a la plataforma.**
5. **Demanda por intención:** páginas de carta indexables con "precio en pesos" (la ruta `/catalog/[cardId]` ya existe) y wishlists que avisan cuando aparece la carta.
6. **Presencia en eventos:** ligas y torneos con QR al mercado y tiendas aliadas como puntos de entrega.

### 2.3 Monetización

**Situación actual:** 1% del precio con mínimo de ARS 1, cobrado como `marketplace_fee` dentro de la preferencia de MP. Sobre un ticket de ARS 25.000 son ARS 250. No cubre ni el soporte de una disputa.

**Lo que paga hoy el vendedor** (tarifa oficial de MP para cobro al instante: 6,29% + IVA, es decir 7,61%; a 35 días: 1,49% + IVA, es decir 1,80% — [MP link de pago](https://www.mercadopago.com.ar/herramientas-para-vender/link-de-pago), [MP checkout](https://www.mercadopago.com.ar/herramientas-para-vender/check-out)):

| Comisión plataforma | Costo total vendedor, cobro inmediato | Costo total vendedor, a 35 días | Comparación |
|---|---|---|---|
| 1% (actual) | 8,6% | 2,8% | Cartealo: 5-6,75% vendedor + 2,5% comprador. Card Stash: ~3,4% + MP. ML: ~12-15% + IVA. |
| 3% | 10,6% | 4,8% | Sigue debajo de ML y comparable a Cartealo |

**Insight clave:** lo que empuja al vendedor a cobrar por afuera **no es el 1% de TCG.ar, es el 7,6% de MP** por cobro inmediato. Bajar la comisión propia a casi cero no resuelve la fuga. Lo que sí la resuelve es (a) que pagar por la app tenga beneficios reales para las dos partes (§2.4) y (b) mostrarle al vendedor que si elige un plazo de acreditación más largo en su cuenta de MP paga mucho menos.

**Recomendación:**
- **Modelo:** porcentaje con piso. Por ejemplo, 3% con mínimo de ARS 300-500, más 0% durante el período de siembra. El porcentaje escala con cartas caras y el piso cubre el costo operativo en las baratas.
- **El piso obliga a tener carrito.** Una carta de ARS 1.500 con piso de ARS 400 no cierra; diez cartas del mismo vendedor en una sola compra sí. El carrito multi-carta por vendedor pasa a ser core para el jugador competitivo.
- **Una sola fuente de verdad** para la comisión (config en servidor), mostrada igual en publicación, checkout, email y transacción.
- **Otras fuentes con sentido en este mercado** (en orden de cuándo activarlas):
  1. Publicaciones destacadas y "subir" publicación (pago por visibilidad): simple y no toca el flujo de pago.
  2. Plan "Vendedor Pro" mensual: carga masiva, estadísticas, comisión reducida y link de tienda personalizado. Apunta a tiendas y revendedores.
  3. Envío integrado (margen sobre etiquetas de Correo Argentino o Andreani): cuando haya volumen.
  4. Verificación física en eventos o tiendas aliadas (el "TPS" que Cartealo anuncia): diferencial de confianza para cartas caras, con precio por operación.

### 2.4 Desintermediación: qué impide arreglar por afuera

**Hoy, nada, y el producto incluso lo facilita:**
- El fallback P2P con alias/CBU es un camino de **comisión cero** ofrecido por la misma app, y el onboarding lo pone primero (`app/(dashboard)/onboarding/page.tsx:48`).
- El perfil social expone WhatsApp, Instagram y Discord públicamente.
- La ficha dice "coordinalo por chat antes de pagar", pero el chat solo existe **después** de reservar, así que la conversación previa se va a WhatsApp.
- Subastas, claims y trades terminan con "coordiná con el vendedor".

**Incentivos concretos para que el pago pase por la app:**

| Palanca | Para quién | Implementación |
|---|---|---|
| **MP obligatorio para vender** (sacar el fallback de alias para publicaciones) | Plataforma | Conectar MP en el onboarding, antes de la primera publicación |
| **Reputación que solo suma con pagos dentro de la app** | Vendedor | Calificaciones y "ventas cerradas" solo para operaciones verificadas por MP (hoy las calificaciones de operaciones P2P también cuentan) |
| **Protección solo dentro de la app** | Comprador | Programa de protección claro (§2.5) que solo aplica si pagaste por la app. Comunicarlo en la ficha. |
| **Visibilidad** | Vendedor | Ranking del mercado que premia ventas cerradas por la app y tiempo de despacho |
| **Contacto mediado** | Ambos | Ocultar WhatsApp y alias en perfiles públicos. Preguntas públicas en la ficha (como ML). Aviso automático si el chat detecta un teléfono, CBU o alias antes del pago. |
| **Costo de MP visible y elegible** | Vendedor | Mostrar el neto según el plazo de acreditación que tenga configurado en MP |
| **Link de tienda** | Vendedor | Que su audiencia de Instagram pague por la app (§2.2): fuga convertida en adquisición |

### 2.5 Confianza sin escrow: el riesgo central

**¿Alcanzan la reputación y las disputas no vinculantes? No, por tres razones:**
1. **Arranque en frío de la confianza:** al lanzar, nadie tiene reputación. El primer comprador le paga a un desconocido con "0 calificaciones" y la app le dice "guardá el comprobante".
2. **Hoy la reputación se puede fabricar o suplantar:** suplantación de cuentas (§5, C1), "pago verificado" falso (C2), badge de MP editable (C3), y calificaciones que cuentan aunque la operación no se haya pagado por MP.
3. **Una disputa sin consecuencia no protege:** no hay evidencia, ni backoffice, ni nadie que resuelva. La pantalla dice "el equipo de moderación interviene" y ese equipo no tiene herramientas.

**Además, el marco legal no acompaña el "somos un clasificado".** La jurisprudencia reciente trata a las plataformas que cobran comisión, ofrecen pagos y reputación como parte de la cadena de comercialización (art. 40 de la Ley 24.240) y las condena solidariamente: caso Almirón c/ Mercado Libre ([análisis](https://abogados.com.ar/el-rol-de-la-plataformas-en-la-cadena-de-comercializacion-un-analisis-del-caso-almiron-cmercado-libre/39415), [Diario Judicial](https://www.diariojudicial.com/news-102984-mercado-libre-no-fue-solo-intermediario)). Los resúmenes son de medios especializados: validar con un abogado. La conclusión práctica: **el disclaimer no reemplaza un sistema de protección real**, y hace falta un proceso de reclamos que funcione.

**Alternativas sin convertirse en PSP** (la plataforma nunca toca la plata):

| Opción | Cómo protege | Costo / complejidad | Recomendación |
|---|---|---|---|
| **Split de MP con liberación diferida** | MP retiene el dinero del vendedor hasta la entrega. Es MP quien custodia, no TCG.ar. | Requiere acuerdo comercial con MP: las fechas de liberación de comisiones y el modelo 1:N pasan por un ejecutivo ([docs split 1:N](https://www.mercadopago.com.br/developers/en/docs/split-payments-1-n/overview)) | **Explorar ya** con MP y con un abogado. Es la opción que más cambia la confianza. |
| **Protección propia de MP al comprador** | Reclamo por "producto no recibido" cuando se paga con cuenta MP ([blog MP](https://www.mercadopago.com.mx/blog/compra-protegida-mercado-pago-como-reclamar)) | Gratis | Confirmar condiciones en Argentina para Checkout Pro en sitios externos (hay casos en que MP negó la cobertura por pagos fuera de su flujo: [Diario Judicial](https://www.diariojudicial.com/news-84652-mercado-no-libre-de-multa)). Si aplica, comunicarlo. |
| **"Cuenta MP verificada" como señal de identidad** | MP ya hizo KYC del vendedor | Gratis: ya se guarda la credencial OAuth | Mostrarlo con texto honesto ("identidad validada por Mercado Pago"), derivado del servidor y no del perfil editable |
| Verificación de DNI propia para vendedores de tickets altos | Disuade estafas | Proveedor de validación de identidad o revisión manual | Fase 2, con umbral (ej. más de ARS 100.000) |
| Límites para vendedores nuevos | Acota la pérdida máxima | Bajo | Sí: ticket máximo hasta N ventas cerradas |
| Fotos reales obligatorias, con frente, dorso y papelito con usuario y fecha para cartas caras | Contra fotos robadas y falsificaciones | Bajo | Sí |
| Envío con tracking obligatorio y botón "No llegó" con plazos | Evidencia y proceso | Bajo a medio | Sí |
| Puntos de entrega en tiendas aliadas | Encuentro seguro, verificación en mano | Acuerdos comerciales | Sí en AMBA: además ancla a las tiendas |
| Fondo de reembolso propio y discrecional (financiado con parte de la comisión, con tope por operación) | Promesa concreta al comprador | Riesgo financiero acotado; revisar encuadre legal | Evaluar después de tener datos de fraude reales |

### 2.6 Unit economics (supuestos marcados)

**Supuestos (ajustalos):** ticket promedio ARS 25.000 · USD 1 = ARS 1.450 · ingreso neto de impuestos del 80% de la comisión · infraestructura de USD 67/mes ≈ ARS 97.000 (Vercel Pro USD 20, porque el plan Hobby no permite uso comercial; Supabase Pro USD 25; Resend Pro USD 20 cuando se pase de 100 mails/día; dominio; Sentry gratis — fuentes secundarias: [Vercel](https://modelence.com/compare/vercel-pricing), [Supabase](https://makerkit.dev/blog/saas/supabase-pricing), [Resend](https://automationatlas.io/answers/resend-pricing-explained-2026/)) · una persona a media jornada valuada en USD 1.000/mes.

| Comisión | Ingreso neto por operación | Punto de equilibrio (solo infra) | Punto de equilibrio (infra + 1 persona a media jornada) | GMV mensual necesario |
|---|---|---|---|---|
| 1% (actual) | ARS 200 | 486 operaciones/mes | **7.736 operaciones/mes** | ARS 193 M |
| 3% | ARS 600 | 162 | 2.579 | ARS 64 M |
| 4% | ARS 800 | 121 | 1.934 | ARS 48 M |
| Fijo ARS 500 | ARS 400 | 243 | 3.868 | ARS 97 M |

**Lectura:**
- Con 1%, la plataforma necesita unas 260 operaciones **por día** para pagar a una persona a media jornada. Es inalcanzable en el corto plazo para un nicho como este.
- Con 3% o más y carrito (más ticket por operación), el equilibrio de infraestructura llega con 150-250 operaciones por mes, algo alcanzable con 30 vendedores activos.
- Falta sumar el costo de soporte por disputa (si cada disputa lleva 30 minutos y la tasa es del 3%, a 2.500 operaciones/mes son unas 37 horas de soporte). Es otra razón para que la comisión no sea simbólica.

### 2.7 Riesgos

| Riesgo | Probabilidad / impacto | Mitigación |
|---|---|---|
| **Estafa por suplantación o pago falso** (bugs C1-C3) | Alta / crítico | Bloqueante: arreglar antes de cualquier usuario real (§5.1) |
| Falsificaciones (proxies, reimpresiones) | Media / alto en cartas caras | Fotos con papelito, disputa por "no auténtica", verificación en tienda aliada, límites a vendedores nuevos |
| Doble venta y reservas trabadas | Alta con volumen / alto | Arreglo de §3.2 |
| Legal: defensa del consumidor (art. 40) | Media / alto | Sociedad (SAS), T&C revisados por abogado, proceso de reclamos, identificación del operador. Los T&C actuales no tienen razón social, CUIT, domicilio ni email de contacto. |
| Legal: datos personales (Ley 25.326) | **Alta hoy** / alto | WhatsApp y alias/CBU legibles públicamente (C3). Minimizar datos, política de privacidad real, evaluar inscripción de bases ante la AAIP. |
| Fiscal | Media | Facturar la comisión propia. Alertar a vendedores habitualistas, sin asumir su situación fiscal. |
| Dependencia de Mercado Pago | Alta / alto | Es el único proveedor: aprobación de la app OAuth, cambios de tarifa, cobertura. Mantener la relación comercial y monitorear webhooks (ya existe auditoría en `mp_webhook_events`). |
| Dependencia de TCGdex | Media / medio | API gratuita sin SLA. Cachear el catálogo en la base (la tabla `catalog_cards` existe y no se usa) y degradar a carga manual. |
| Precios de referencia en EUR con inflación | Alta / medio | La referencia de Cardmarket es del mercado europeo y no incluye el costo de importar. Mostrarla convertida con fecha y tipo de cambio, o reemplazarla por la mediana de ventas locales (§4). |
| Infraestructura | Media / medio | Vercel Hobby prohíbe uso comercial y limita el cron a uno por día. Supabase Free pausa proyectos inactivos. Pasar a planes pagos antes de abrir. |
| Bus factor | Alta / alto | Una persona y PRs generados con agentes. Tests de pagos y runbooks antes de escalar. |
| Competencia | **Alta** / alto | Cartealo ya tiene la liquidez. Diferenciarse (§1 y §2.5) o elegir otro segmento (tiendas, AMBA presencial, competitivo con carrito). |

---

## 3. Producto y funcionalidades

### 3.1 Clasificación para el lanzamiento

| Funcionalidad | Estado real | Clasificación | Decisión |
|---|---|---|---|
| Catálogo TCGdex + búsqueda | Funciona; catálogo en inglés; búsqueda por substring; sin filtro de set, idioma ni rareza | **Core** | Mejorar |
| Inventario con foto y condición | Funciona, pero en producción probablemente roto por `back_image_url` | **Core** | Fusionar con "publicar" en un solo paso |
| Publicación de carta suelta | Funciona; vende la publicación entera aunque tenga varias unidades | **Core** | Arreglar stock |
| Ficha de publicación | Funciona; sin CTA fijo; foto de catálogo como si fuera real | **Core** | Rediseñar confianza |
| Checkout MP + webhook + reconciliación | Sólido en el camino feliz; huecos de doble venta y reembolsos | **Core** | Arreglar §3.2 |
| Página de transacción con chat | Buena estructura; sin acciones cuando no está pagada | **Core** | Completar estados |
| Envío o retiro con tracking | Tracking como texto libre; costo de envío fuera del checkout | **Core** | Costo de envío en checkout |
| Calificaciones | Funcionan; solo el comprador califica | **Core** | Solo con pago verificado |
| Notificaciones in-app + emails transaccionales | Funcionan | **Core** | Sumar emails de reserva por vencer y de match de wishlist |
| Perfil público del vendedor | Funciona | **Core** | Volverlo "tienda" compartible |
| Watchlist y alertas | Solo in-app | Soporte | Sumar email |
| Disputas | Formulario de texto, sin evidencia ni backoffice | Soporte (mínimo viable) | Evidencia + panel admin mínimo |
| Onboarding de vendedor | Lleva a alias/CBU | Soporte | Rehacer: MP y primera carta |
| Follow | Funciona; sin aviso de nuevas publicaciones | Soporte | Aviso cuando publica alguien que seguís |
| Fallback P2P (alias/CBU) | Comisión cero, sin verificación | **Ruido / riesgo** | Congelar para publicaciones |
| Subastas | Sin anti-snipe, carrera de pujas, cierre una vez por día, pago por afuera, transacción rota | **Ruido** | Congelar |
| Claims en vivo | Sin tiempo real (hay que recargar), sin pago ni transacción | **Ruido** | Congelar |
| Trades | Sin dinero ni comisión; requieren liquidez | **Ruido** para el lanzamiento | Congelar (volver con liquidez) |
| Mystery packs | Ya pausados | Ruido | Mantener pausados; limpiar la UI residual |
| Drops | Planeados, no existen | Ruido | No construir |
| Directorio de perfiles (`/profiles`) | Muestra contadores en cero | Ruido | Ocultar |
| `/ui-kit` | Se publica en producción | Ruido | Excluir del build de producción |

**Congelar** significa: sacarlo de la navegación, del home y de "Cómo funciona", y dejar el código detrás de un feature flag. No hace falta borrar nada.

### 3.2 Huecos del flujo principal (para que una compra salga bien sin intervención manual)

Ordenados por gravedad:

1. **Seguridad** (C1-C3 en §5.1). Sin esto, cualquier otra mejora es irrelevante.
2. **Doble venta.** La preferencia de MP se crea sin vencimiento ni `binary_mode` (`lib/server/mp-client.ts:109`). Si el comprador paga tarde (por ejemplo en efectivo en Rapipago o Pago Fácil, que acredita en días) después de que la reserva se liberó y otro compró, `verifyTransaction` marca la publicación como vendida sin chequear su estado (`lib/server/repository.ts:2443`). Resultado: dos compradores pagaron. **Arreglo:** vencimiento de la preferencia igual a la ventana de reserva, `binary_mode: true` o excluir medios de pago diferidos, y si llega un pago aprobado para una publicación ya vendida, reembolso automático por la API de MP y aviso a las partes.
3. **Stock.** El checkout cobra 1 unidad pero la publicación entera pasa a "vendida", aunque tenga 4 copias. **Arreglo:** decrementar la cantidad y volver a `active` si queda stock.
4. **Costo de envío fuera del checkout.** Se arregla por chat y se paga por afuera. **Arreglo:** opciones de envío con precio fijo por vendedor (ej. "Correo Argentino a todo el país: ARS X"), sumadas a la preferencia.
5. **Transacción no pagada sin salida.** La página de detalle no muestra ninguna acción si el pago no está verificado (`components/order-panel.tsx:198`): ni "Pagar" (la URL de checkout se guarda pero no se usa), ni "Cancelar reserva", ni cuenta regresiva, ni chat. **Arreglo:** estado "Esperando pago" con CTA para pagar, cancelar y tiempo restante.
6. **Vencimiento de reservas real.** Con un cron diario, la reserva dura entre 30 minutos y 24 horas. **Arreglo:** job cada 5-10 minutos (Vercel Pro o `pg_cron` en Supabase) o vencimiento al leer, más límite de reservas simultáneas por comprador (hoy alguien puede reservar 20 publicaciones por minuto y bloquear el mercado).
7. **Máquina de estados sin validar.** `PATCH /api/transactions/:id/fulfillment` deja que cualquiera de las partes ponga casi cualquier estado desde cualquier estado: el vendedor puede marcar "enviado" sin pago o "cerrado" antes de la entrega; el comprador puede marcar "entregado" antes del envío. **Arreglo:** tabla de transiciones permitidas por rol y estado, validada en el servidor.
8. **Reembolsos y contracargos.** El webhook solo procesa pagos aprobados (`lib/server/mp-reconcile.ts:81`). Un pago reembolsado o con contracargo deja la operación como "verificada". **Arreglo:** manejar `refunded`, `charged_back` y `cancelled`.
9. **Cierre automático.** Si el comprador nunca confirma, la operación queda abierta para siempre (prometido en `PAYMENTS.md` y no implementado). **Arreglo:** autoconfirmación N días después del envío con tracking, con recordatorios.
10. **Disputas sin resolución.** Sin evidencia, sin estados de mediación, sin panel. **Arreglo:** adjuntos (Supabase Storage), estados (abierta → en revisión → resuelta a favor de comprador o vendedor) y un panel admin mínimo con rol (no un `ADMIN_SECRET` compartido).
11. **Backoffice inexistente** para pagos trabados, usuarios y suspensiones. La suspensión no se aplica en ningún flujo.
12. **Registro y confirmación de email.** Los templates de Auth en producción siguen pendientes (README). Después del registro no hay onboarding.
13. **Preguntas antes de comprar.** Hoy no hay forma de preguntarle algo al vendedor sin reservar (en producción hay una tabla `conversations` sin uso que parece el inicio de esto).
14. **Foto engañosa.** Si el vendedor no sube foto, se guarda la del catálogo como foto de la publicación y el comprador no puede distinguirla. **Arreglo:** etiqueta "Foto de catálogo" y foto real obligatoria por encima de cierto precio.
15. **Atributos TCG que faltan:** idioma (inglés, español, japonés cambian mucho el precio), edición o primera edición, holo o reverse, gradeada (PSA, CGC y nota). Sin esto, la búsqueda por "carta exacta" no funciona.
16. **Escala:** el mercado trae **todas** las publicaciones (incluidas vendidas y reservadas) y filtra en JavaScript, sin paginación. Funciona con 10 publicaciones; con 5.000 no.

### 3.3 Features nuevas (solo si mueven una métrica)

| Feature | Problema | Métrica que mueve / impacto esperado | Esfuerzo |
|---|---|---|---|
| **"Vender una carta" en un paso** (buscar → foto → condición → precio sugerido → envío por defecto → publicar) | Hoy son dos formularios y ~20 toques | Activación de vendedores; tiempo a la primera publicación por debajo de 3 minutos | M |
| **Carrito multi-carta por vendedor** | El envío y el piso de comisión no cierran con cartas baratas | Conversión y ticket promedio (+2-3× en compras de jugadores) | L |
| **Envío con costo en el checkout** | Negociación por chat y pago por afuera | Conversión e ingreso (todo el monto pasa por MP) | M |
| **Precio sugerido en ARS** (mediana de ventas locales + referencia EUR convertida con fecha y tipo de cambio) | El vendedor no sabe cuánto pedir; la referencia en EUR confunde | Activación y sell-through | M |
| **Link de tienda compartible** | El semi-vendedor ya tiene audiencia en Instagram y WhatsApp | Adquisición de demanda a costo cero; transacciones dentro de la app | S |
| **Carga masiva** (pegar lista "SV3 125 NM ×2", CSV, luego OCR) | Cargar 100 cartas una por una es inviable | Oferta (publicaciones por vendedor) | M (OCR: L) |
| **Email y push cuando aparece una carta buscada** | Hoy el aviso es solo in-app y nadie entra a mirarlo | Retención y conversión | S |
| **Preguntas públicas en la ficha** | Dudas sin canal y fuga a WhatsApp | Conversión y menos desintermediación | S-M |
| **"Hacer oferta"** | El regateo se va al chat o a WhatsApp | Conversión | M |
| **Badge "Identidad validada por MP" + límites para nuevos** | Confianza en vendedores sin historial | Conversión en la primera compra; menos fraude | S |
| **Colección con valor en ARS** | No hay motivo para entrar si no estás comprando o vendiendo | Retención y parte alta del embudo (Cartealo ya lo tiene) | M |
| Órdenes de compra (como Card Stash) | El comprador espera una carta a un precio | Liquidez | L (después) |

---

## 4. Experiencia de usuario

**Método:** build de producción local sin backend, capturas a 375×812 (en `docs/analisis-producto/`), auditoría automática de toque, labels y `alt`, Lighthouse mobile en páginas estáticas. Lo que depende de datos se infiere del código y está marcado **[código]**. Los tiempos son estimaciones, no mediciones cronometradas.

### 4.a Comprador nuevo: home → busca → ficha → reserva → paga → envío → recibe → califica

| Paso | Toques / campos | Fricción o problema |
|---|---|---|
| Home | 1 ("Abrir mercado") | En mobile la primera pantalla es solo texto y dos botones: no se ve ni una carta ni un buscador ([captura](analisis-producto/home-375.png)). El header mobile esconde el buscador (solo desde 768 px) y el link "Ingresar" (solo desde 640 px). Con sesión iniciada no hay navegación inferior en las páginas públicas. |
| Mercado | 2-3 (buscar + filtros) | Búsqueda por substring en nombre y set, sin autocompletado (el roadmap lo pedía), sin tolerancia a errores, sin filtro de set, idioma ni rareza. El listado y el contador incluyen publicaciones vendidas y reservadas. Si falla el backend se ve el error técnico crudo ("Error: TypeError: fetch failed") junto al estado vacío "Sin publicaciones" ([captura](analisis-producto/market-375.png)). |
| Ficha [código] | Scroll | Imagen 3:4 a ancho completo: el precio y el botón quedan debajo del pliegue y **no hay CTA fijo** (el roadmap lo pedía). El @usuario del vendedor no lleva a su perfil. "Perfil activo" aparece siempre. La foto puede ser la de catálogo sin aviso. La referencia en EUR va sin conversión. Una publicación vendida muestra el estado en inglés ("sold"; `app/(public)/market/[listingId]/page.tsx:214`). |
| Reservar | 1 + login | Sin sesión, "Iniciá sesión para reservar" lleva a `/login` **sin `?next=`**: después del login el comprador pierde la carta. |
| Pagar con MP [código] | Formulario de MP | Si el vendedor no tiene MP, el botón dice "Reservar y coordinar" y después lleva a la **lista** de transacciones, no a la operación. Si cancela en MP, vuelve a la lista. |
| Esperar el pago | 0 | Si el webhook tarda: "recargá esta página en un momento". Si el control de monto falla, se muestra el motivo técnico ("amount mismatch: expected…"). |
| Seguir el envío | — | El tracking es texto, sin link al correo ni estimación. Sin recordatorios si se demora. |
| Recibir y calificar | 2-3 | Bien resuelto. Detalle de copy: después de calificar dice "esperamos a que el sistema cierre la operación en segundos", pero ya se cerró. |

**Total estimado:** 9-12 toques más login (2 campos) más el checkout de MP. **Abandono probable:** login sin retorno, CTA fuera de pantalla, y el paso P2P donde el comprador termina en una lista sin instrucciones.

### 4.b Vendedor nuevo: registro → onboarding → MP → primera carta → publicar → vender → despachar

| Paso | Toques / campos | Fricción o problema |
|---|---|---|
| Registro | 3 campos + checkbox | Buen copy legal (mayor de 18, "no custodia fondos"). El checkbox mide **13×16 px**. El eyebrow dice "Onboarding vendedor" también a quien solo quiere comprar ([captura](analisis-producto/register-375.png)). |
| Confirmación de email | Salir de la app | Templates de producción pendientes. Si el email no llega, el embudo se corta. |
| Onboarding | **Se saltea** | El registro redirige a `/inventory`. El wizard solo aparece si se entra a `/dashboard`, y cuando aparece pide alias/CBU y no MP. |
| Conectar MP | Ir a Cuenta → OAuth | No está en ningún flujo guiado. Una checklist del dashboard lo sugiere. |
| Cargar carta | Abrir acordeón, buscar y elegir, 2 fotos opcionales, condición, cantidad, precio, toggle de trade, notas | La foto es opcional; sin foto se usa la de catálogo. Sin compresión: el límite es 5 MB y muchas fotos de celular lo superan. Sin precio sugerido. |
| Publicar | Encontrar la carta en la lista → "Publicar" → precio (otra vez), cantidad, envío/retiro, detalle de entrega (mínimo 8 caracteres, **cada vez**) | Dos formularios para una sola publicación. La comisión del 1% se muestra aunque no tenga MP (y entonces no se cobra). |

**Total estimado:** unos 11 campos y 18-22 toques. **Tiempo a la primera publicación:** 3-5 minutos sin confirmación de email y con el catálogo respondiendo; 5-15 minutos con confirmación. La meta del roadmap (menos de 5 minutos) **se cumple solo en el mejor caso y sin MP conectado**, que es justamente el caso que no le sirve al negocio. No lo pude cronometrar por no tener backend.

**Propuesta:** "Vender una carta" en un paso, con defaults de envío guardados en el perfil y MP conectado antes de la primera publicación (una vez, en unos 60 segundos de OAuth).

### 4.c Formatos secundarios

| Formato | Problemas de UX y de flujo |
|---|---|
| Subasta | Sin anti-snipe (el roadmap lo pedía). Sin aviso de "te superaron". Cierre real solo cuando corre el cron diario o alguien intenta pujar: el contador llega a cero y la subasta sigue "activa" horas. El ganador recibe "coordiná el pago" y la transacción no avanza. Dos pujas simultáneas pueden pisarse (`placeAuctionBid`, `lib/server/repository.ts:1857`, lee y escribe sin bloqueo). |
| Claim | El formato existe para ganar una carta en vivo, pero la vista no se actualiza sola: hay que recargar. Después del claim no hay pago ni transacción. "Claim" es jerga de Instagram y no se explica en ningún lado. |
| Trade | Dos pantallas separadas (Trades y Propuestas) con el mismo ícono. Sin ayuda para valuar el intercambio. Requiere que ya haya muchos usuarios. Muestra contadores en cero ([captura](analisis-producto/trades-375.png)), lo contrario de prueba social. |
| Mystery pack | Pausado en la API, pero el modelo y parte de la UI siguen. |

### 4.d Cuando algo sale mal

| Situación | Qué ve el usuario hoy | Qué debería ver |
|---|---|---|
| Pago que no impacta | "Recargá esta página" o el motivo técnico. Sin contacto de soporte. | Estado "Verificando tu pago" con actualización automática, explicación y botón de ayuda |
| Reserva vencida | Nada. No hay aviso, ni cuenta regresiva, ni email. Puede pagar igual y terminar en doble venta. | Cuenta regresiva, email antes de vencer y pago bloqueado al vencer |
| Envío demorado | Nada | Recordatorio al vendedor a las 48 h y botón "No llegó" para el comprador a los N días |
| Disputa | Formulario de texto libre; "el equipo de moderación interviene" | Motivos predefinidos, adjuntos, plazos y estado visible para las dos partes |
| Errores técnicos | Mensajes en inglés o crudos: "Listing is not available.", "Unauthorized", "Too many requests. Retry in 30s.", "Error: TypeError: fetch failed" | Mensajes en español, con qué pasó y qué hacer |

### 4.e Confianza: lo que ve un comprador antes de pagarle a un desconocido

**Lo bueno:** bloque de reputación con promedio, cantidad, ventas cerradas y % de disputas; aviso explícito cuando el vendedor es nuevo o no tiene MP; texto "Cómo va a ser la compra" en tres pasos.

**Lo que falta o confunde:**
- "Mercado Pago automático" y "Comprar con MP" dependen de `profiles.mp_connected`, que el propio usuario puede editar (§5.1, C3).
- "MP conectado" con escudo se lee como "vendedor verificado".
- "Perfil activo" aparece siempre: es ruido que diluye las señales reales.
- No se distingue foto real de foto de catálogo.
- No hay ubicación del vendedor, antigüedad ni tiempo promedio de despacho en la ficha (la antigüedad ya se calcula).
- No hay una política clara de qué pasa si no llega.
- La condición no tiene guía visual: ¿qué es "Ligeramente jugada"?

### 4.f Arquitectura de información y navegación

- **16 ítems en el sidebar**, en cuatro grupos. "Mis ventas" son las publicaciones (no las ventas); las ventas y las compras están en "Operaciones". "Trades" y "Propuestas" comparten ícono.
- **La navegación inferior no refleja las tareas más frecuentes:** incluye Trades (cero uso) y no incluye Compras ni Cuenta. Además, tocar "Mercado" lleva a una ruta pública donde **la barra inferior desaparece**.
- **Cuatro maneras de comprar** (Mercado, Subastas, Claims, Trades) compiten desde el home sin explicar la diferencia.
- **Propuesta para el lanzamiento:** barra inferior global, también en páginas públicas con sesión: **Mercado · Buscar · Vender (+) · Operaciones · Cuenta**. Sin sesión: header con buscador e "Ingresar" visibles en mobile.

### 4.g Mobile-first

- **Zona del pulgar:** el CTA de compra no es fijo y queda arriba o fuera de pantalla según el scroll. Debería ir en una barra fija abajo con precio y botón.
- **Tamaños de toque** (auditoría automática): links del footer de 15 px de alto, checkbox de términos de 13×16, botón de mostrar contraseña de 36×36, etiquetas de la barra inferior de 10 px.
- **Layout del header mobile:** sin buscador, el botón "Crear cuenta" queda pegado al logo en vez de alineado a la derecha ([captura](analisis-producto/home-375.png)).
- **Bien resuelto:** filtros en bottom sheet con chips activos, input de búsqueda `type=search`, sin scroll horizontal (ancho del documento: 375 px en todas las páginas medidas).

### 4.h Consistencia visual (design system glass-dark)

- La migración a glass-dark se hizo, pero conviven tokens viejos y nuevos: `--color-ink-subtle` y `text-h1 [font-family:var(--font-display)]` junto a `t-mute`, `--ink-soft` y `t-display`.
- `components/layout/public-header.tsx` está muerto (no se usa) y define otra versión del logo.
- `/ui-kit` se publica en producción.
- 25 `<img>` sin optimizar contra 5 usos de `next/image` (el roadmap pedía migrar todo).
- Quedan los SVG de ejemplo de Next en `public/` (`next.svg`, `vercel.svg`, etc.).

### 4.i Microcopy (es-AR)

- **Voseo sin tildes en varias pantallas:** "Intercambia", "Marca tus cartas", "publica que estas buscando", "encontra", "todavia", "coordina", "guarda", "reputacion", "Trades Pokemon". Debería ser "Intercambiá", "Marcá", "publicá", "estás", "encontrá", "todavía", "coordiná", "guardá", "reputación", "Pokémon".
- **Mensajes en inglés** que llegan a la UI desde la API (ver §4.d) y estado "sold" en la ficha.
- **Jerga TCG:**
  - "Moderadamente jugada (MP)" choca con "MP" = Mercado Pago, que se usa en toda la app. Conviene escribir siempre "Mercado Pago" completo o mostrar la condición como "MP (Moderately Played)" con explicación.
  - "Mint (NM+)" es impreciso: Mint no es NM+.
  - Faltan idioma, edición y gradeo (§3.2).
- **Confusiones de monto:** al comprador se le muestra "Comisión plataforma" y "Precio bruto", que son conceptos del vendedor.
- **Etiquetas de estado** que mencionan "MP/Stripe" cuando Stripe no existe en v1.

### 4.j Precios: EUR de referencia y ARS

Hoy la ficha muestra "Referencia internacional: EUR 12.50 · Cardmarket" sin conversión, sin fecha y sin aclarar que es el promedio de Europa para cartas en NM. Para un comprador argentino **confunde más de lo que ayuda**: no sabe qué tipo de cambio usar, y el precio local incluye importación y escasez.

**Propuesta:**
- **Vendedor:** precio sugerido en ARS = mediana de ventas cerradas en la app (cuando haya datos) + referencia de Cardmarket convertida con tipo de cambio configurable (MEP o tarjeta) y fecha.
- **Comprador:** "Precio de mercado en TCG.ar" (últimas ventas) y, como dato secundario, "Ref. Europa ≈ ARS X (al dd/mm)". Nunca un EUR suelto.

### 4.k Accesibilidad (WCAG 2.1 AA)

| Criterio | Resultado |
|---|---|
| Contraste | **Falla.** `--ink-soft` (placeholders, hints, captions y etiquetas inactivas de la barra inferior) da ~3,8:1 sobre los fondos oscuros (mínimo: 4,5:1). El texto blanco sobre el azul primario `#3D7BFD` da **3,85:1**: falla en todos los botones primarios. Lighthouse marca contraste insuficiente en las dos páginas medidas. `--ink-mute` (7,5-8:1) y `--accent-hi` (6,7-7,8:1) pasan. |
| Foco visible | Solo `Button` define `focus-visible`. Links, chips y tarjetas dependen del default del navegador. |
| Labels | Formularios bien etiquetados. Excepción: el buscador de `/trades` (input `q` sin label). |
| Texto alternativo | Todas las imágenes tienen `alt` en las páginas medidas. |
| Idioma | `lang="es"`; mejor `es-AR`. |
| Tamaño de texto | Etiquetas de 10-11 px en la barra inferior y en chips. |

**Arreglo de bajo costo:** subir `--ink-soft` a una opacidad de ~0,6 y oscurecer el primario (ej. `#2563EB`, alrededor de 5:1 con blanco) o usar texto oscuro sobre `--accent-hi`.

### 4.l Performance percibida

- **Lighthouse mobile** (localhost, páginas estáticas): `/how-it-works` Performance 79 (LCP 3,9 s, TBT 380 ms, CLS 0), Accesibilidad 96, Buenas prácticas 100, SEO 100. `/login` Performance 93 (LCP 3,0 s). El roadmap pedía más de 85 en home y mercado y más de 90 en fase 7. Si una página estática tiene 380 ms de bloqueo, hay demasiado JavaScript de cliente en el layout.
- **Riesgos en las páginas con datos [código]:**
  - Todo es `force-dynamic`, sin caché propia.
  - El mercado trae todas las publicaciones y hace hasta 24 llamadas a PokeAPI por request para mostrar el tipo de Pokémon (decorativo).
  - Las imágenes de cartas son PNG de alta resolución de TCGdex servidas con `<img>` (sin redimensionar).
- **Skeletons:** existen `loading.tsx` en mercado, transacciones y dashboard. Falta en ficha y perfil.
- **Recomendado:** `next/image` con tamaños, paginación, sacar PokeAPI del listado, y caché del catálogo.

### 4.m Retención: qué hace volver al usuario

| Mecanismo | Estado | Problema | Propuesta |
|---|---|---|---|
| Notificaciones in-app | Polling cada 30 s | Solo sirven si la app ya está abierta | Email transaccional + push web |
| Watchlist / buscadas | Aviso in-app cuando aparece una coincidencia | Nadie se entera fuera de la app | Email inmediato o digest diario, con precio |
| Follow | Existe | No avisa cuando el seguido publica | Aviso y feed "Nuevas de vendedores que seguís" |
| Suscripción a subastas | Existe | Formato congelado | — |
| Push / PWA | Hay manifest, **no hay service worker** | No hay push ni modo offline; "PWA" es solo instalable | Service worker + Web Push (iOS 16.4+ si está instalada) |
| Valor de colección | No existe | No hay razón para entrar si no estás comprando | Colección con valor en ARS y alertas de precio |
| Emails de ciclo de vida | No existen | — | Bienvenida, "terminá de configurar tu cuenta", "tu carta buscada bajó de precio", resumen semanal |

---

## 5. Diagnóstico técnico (tech lead)

### 5.1 Seguridad: bloqueantes

| ID | Hallazgo | Evidencia | Arreglo | Esfuerzo |
|---|---|---|---|---|
| **C1** | **Suplantación de cualquier usuario.** `getAuthenticatedUser` decodifica el JWT de la cookie sin verificar la firma. Un atacante arma `header.{"sub":"<id de la víctima>","exp":2100000000}.cualquiercosa`, lo pone en la cookie `tcg_access_token` y el servidor lo trata como la víctima: puede leer sus chats, cambiar su alias de cobro (`PATCH /api/profile/seller-payment`), publicar, cancelar o marcar entregas. Los IDs se obtienen de `GET /api/listings` (devuelve `sellerId`) o de la tabla `profiles` con la clave pública. | `lib/server/auth.ts:133` y `:159`. Verificado localmente: un token con `alg: none` y firma falsa devuelve los claims. | Verificar la firma con las claves JWKS de Supabase (`jose` + `createRemoteJWKSet` cacheado: sin red por request) o `supabase.auth.getClaims()`. Test que garantice que un token falsificado se rechaza. Corregir el párrafo de `CLAUDE.md`. | S |
| **C2** | **"Pago verificado" falsificable.** El comprador manda cualquier `providerPaymentId`; el endpoint consulta MP con el token de la plataforma y solo mira que el estado sea `approved`. No compara monto, vendedor ni `external_reference`. La UI lo ofrece en `components/transaction-card.tsx:70`. | `app/api/payments/verify/route.ts:108` | Eliminar el endpoint y el panel (el roadmap ya lo pedía), o que pase por `reconcileMpTransaction` con controles estrictos, incluida la coincidencia de `external_reference`. | S |
| **C3** | **Datos personales públicos y escalada sobre el propio perfil.** La política `profiles_select_self_or_public` permite que cualquiera con la clave pública lea **todas las columnas** de los perfiles activos (WhatsApp, alias/CBU, instrucciones de pago, `mp_user_id`). `profiles_update_self` deja que cada usuario edite su `mp_connected` (badge falso de MP) y su `account_status` (des-suspenderse). Confirmado en las políticas de producción. | `supabase/schema.sql:128` y `:131`; `pg_policies` en producción | Vista pública con columnas seguras. Quitar el `UPDATE` directo o restringirlo por columnas. Derivar "MP conectado" en el servidor desde `seller_mp_credentials`, como ya hace la reputación (`lib/server/reputation/queries.ts:80`). | S |
| H1 | Doble venta por pagos tardíos | §3.2 punto 2 | Ver §3.2 | M |
| H2 | Máquina de estados sin validar | `lib/server/repository.ts:2811` | Transiciones por rol y estado | S |
| H3 | Reembolsos y contracargos ignorados | `lib/server/mp-reconcile.ts:81`, `app/api/webhooks/mercadopago/route.ts:60` | Manejar los estados negativos | S-M |
| H4 | Bloqueo del mercado por reservas: 20 por minuto por usuario e IP, sin tope de reservas activas; el rate limit está en memoria | `app/api/listings/[id]/reserve/route.ts` | Tope de reservas activas por comprador; rate limit persistente (Upstash o tabla) | S |
| H5 | Carrera en pujas de subasta (si se descongela) | `lib/server/repository.ts:1857` | Función SQL con bloqueo o condición sobre el precio actual | M |
| M1 | Tokens OAuth de MP de los vendedores en texto plano | `supabase/migrations/20260429000001_mp_marketplace.sql` | Supabase Vault / pgsodium | M |
| M2 | Protección de contraseñas filtradas desactivada | Advisor de seguridad de Supabase | Activarla en Auth | S |
| M3 | Admin con un secreto compartido por header | `app/api/admin/payments/manual-verify/route.ts` | Rol admin en la base + panel | M |
| M4 | ID de transacción `tx_${Date.now()}`: colisiones con concurrencia y fácil de adivinar | `lib/server/repository.ts:2326` y `:1976` | UUID o ULID | S |

### 5.2 Datos y arquitectura

- **`lib/server/repository.ts` tiene 3.883 líneas** con todas las tablas. Funciona, pero cuesta revisar y testear. Conviene partirlo por dominio (`listings`, `payments`, `auctions`, …) sin cambiar contratos.
- **Dos modelos de datos en `schema.sql`.** Hay que borrar el que no se usa y regenerar `schema.sql` desde producción (`supabase db dump`) para que vuelva a ser la fuente de verdad.
- **Dos carpetas de migraciones** (`migrate-vN.sql` y `migrations/` con timestamp), y ya hubo una sin aplicar en producción. Conviene unificar en el formato del CLI de Supabase y aplicar con `supabase db push` desde CI.
- **Regla rota de `CLAUDE.md`:** `app/(dashboard)/transactions/[id]/page.tsx:57` consulta Supabase directo. La comisión se recalcula con el precio **actual** de la publicación en vez de usar `platform_fee_ars` guardado.
- **Comisión duplicada en 5 lugares** (checkout, webhook, página de transacción, tarjeta de inventario, email).
- **Filtrado en memoria y sin paginación** en el mercado y en la reputación (trae todos los `payment_events` de los vendedores en pantalla).

### 5.3 Operación

- **Planes:** Vercel Hobby no permite uso comercial y limita el cron a uno por día (la razón del cron único). Hay que pasar a Pro (USD 20/mes) y correr jobs cada 5-10 minutos. El refresco de tokens de MP busca credenciales que vencen en menos de 1 hora pero corre una vez por día: con tokens de 180 días no es urgente, pero la ventana está mal.
- **Observabilidad:** bien resuelta en la base (logger JSON con `requestId`, Sentry condicionado al DSN, auditoría de webhooks en `mp_webhook_events`, validación de entorno que bloquea el arranque en producción; lo verifiqué al levantar la app). Falta alertar cuando hay webhooks `blocked` o pagos trabados.
- **Backups:** no hay evidencia de backups verificados (el roadmap lo pedía en la fase 7).
- **Analítica de producto:** no existe. No hay eventos para medir el embudo (§7).

### 5.4 Calidad y tests

- CI completa (lint, typecheck, test y build). Todo en verde localmente: 0 errores de lint, 1 warning (`frontVisible` sin usar en `components/ui/card-photo-uploader.tsx:107`), typecheck limpio, **46/46 tests**.
- **Los tests no cubren lo que importa:** no hay tests de auth contra tokens falsos, checkout, webhook, reconciliación, máquina de estados ni reservas. El harness E2E (`scripts/e2e.ts`) es una buena base, pero el "pago verificado" se siembra directo en la base: nunca se prueba un pago real de sandbox de punta a punta.

---

## 6. Plan para terminarla

**Supuesto de recursos** (completalo): una persona desarrollando. Duraciones en semanas a tiempo completo; a media jornada (~20 h/semana), multiplicá por dos.

### Fase 0: decidir y validar (1 semana)

- [ ] **Posicionamiento frente a Cartealo y Card Stash.** Opción recomendada: "la forma más segura y barata de vender tus cartas en AMBA, cobrando por Mercado Pago a tu cuenta", con tiendas aliadas como puntos de entrega y el link de tienda como herramienta del vendedor.
- [ ] **10-15 entrevistas** a semi-vendedores (de grupos de Facebook e Instagram) y **5 tiendas**: dónde venden hoy, qué les duele, cuánto pagarían, si conocen Cartealo.
- [ ] **Nombre y dominio:** ¿`tcg.ar` es tuyo? ¿Qué app sirve hoy? Unificar la marca en metadata, emails, manifest y el descriptor de MP.
- [ ] **Legal:** sociedad (SAS), CUIT, abogado para T&C, privacidad y defensa del consumidor.
- [ ] **Mercado Pago comercial:** consultar split con liberación diferida y la cobertura de Compra Protegida para Checkout Pro en Argentina.

**Criterio de salida:** posicionamiento escrito en una frase, 20 vendedores con intención de cargar inventario, decisión sobre la retención de fondos.

### Fase 1: seguridad y pagos correctos (2 semanas)

- [ ] C1 (verificar JWT), C2 (eliminar `/api/payments/verify` y su panel), C3 (RLS de `profiles` y badge derivado en el servidor).
- [ ] Preferencia de MP con vencimiento y `binary_mode`, liberación segura de reservas y reembolso automático de pagos tardíos.
- [ ] Stock por unidades, máquina de estados validada, reembolsos y contracargos en el webhook.
- [ ] Tope de reservas activas por comprador; jobs cada 5-10 minutos.
- [ ] Comisión con una sola fuente de verdad (y nuevo valor según la Fase 0).
- [ ] **Sacar el fallback P2P de las publicaciones** (MP obligatorio para vender).
- [ ] Migraciones unificadas, `back_image_url` aplicada, `schema.sql` regenerado, RLS del repo igual al de producción.
- [ ] Vercel Pro, Supabase Pro, protección de contraseñas filtradas.
- [ ] Tests: token falsificado rechazado, checkout, webhook con pago tardío, transiciones de estado. Un E2E con sandbox real de MP.

**Criterio de salida:** una compra de sandbox de punta a punta sin intervención; los tres ataques de §5.1 rechazados por tests.

### Fase 2: recortar y simplificar (1 semana)

- [ ] Congelar subastas, claims, trades, mystery packs, `/profiles` y `/ui-kit` en producción (feature flags, fuera de la navegación).
- [ ] Navegación: barra inferior global (Mercado · Buscar · Vender · Operaciones · Cuenta); header mobile con buscador e "Ingresar".
- [ ] Reescribir home ("Cómo funciona" con un solo formato) y corregir el copy (§4.i).
- [ ] Contraste AA (§4.k) y `focus-visible` global.
- [ ] Borrar código muerto (`public-header.tsx`, tablas legacy, SVG de ejemplo).

### Fase 3: cerrar el flujo core (3 semanas)

- [ ] **Vender en un paso**, con defaults de envío en el perfil y conexión de MP en el onboarding. Registro → onboarding siempre.
- [ ] Idioma, edición y gradeo en el modelo y en la búsqueda.
- [ ] Precio sugerido en ARS (referencia convertida con fecha; mediana local cuando haya datos).
- [ ] Ficha: CTA fijo, link al perfil, etiqueta "Foto de catálogo", señales de confianza honestas, política de protección.
- [ ] Opciones de envío con costo dentro del checkout.
- [ ] Transacción: estado "Esperando pago" (pagar, cancelar, cuenta regresiva), autoconfirmación con recordatorios.
- [ ] Preguntas en la ficha (o chat previo mediado).
- [ ] Disputas v1 (motivos, adjuntos, estados) y panel admin mínimo con rol.
- [ ] Emails: reserva por vencer, match de buscadas, bienvenida y "terminá de configurar".
- [ ] `next/image`, paginación, sacar PokeAPI del listado. Lighthouse mobile por encima de 85 en home, mercado y ficha.
- [ ] Analítica de eventos (§7).

### Fase 4: lanzamiento cerrado en AMBA (4-6 semanas de operación)

- [ ] Sembrar 20-30 vendedores con carga concierge, más de 500 publicaciones antes de invitar compradores.
- [ ] 0% de comisión durante la siembra; 2-3 tiendas como puntos de entrega.
- [ ] Revisión semanal de métricas y del 100% de las disputas.

**Criterio de salida:** 50 o más compras pagadas por MP, 80% o más cerradas sin intervención manual, tasa de disputas por debajo del 3%, cero fraudes por fallas de la plataforma, sell-through a 30 días por encima del 20%.

### Después (solo con liquidez)

Carrito multi-carta, "Hacer oferta", link de tienda con dominio propio, colección con valor, push web. Recién entonces reconsiderar subastas (con motor correcto: bloqueo, anti-snipe, cierre por job y pago por MP) y trades.

---

## 7. Métricas e instrumentación

Hoy no hay ningún evento de analítica en la app. Sin esto el lanzamiento cerrado no enseña nada. Sugerencia: PostHog o Plausible, sumando el origen al CSP de `next.config.ts`.

| Etapa | Métrica | Meta del lanzamiento cerrado |
|---|---|---|
| **North star** | Compras pagadas por MP y cerradas por semana | Crecimiento semana a semana |
| Activación de vendedores | % de registrados con MP conectado y primera publicación en 7 días; tiempo a la primera publicación | Más del 50%; menos de 3 minutos |
| Liquidez | Sell-through a 30 días; % de búsquedas con resultado | Más del 20%; más del 60% |
| Conversión | Ficha → checkout iniciado → pagado | Medir línea de base |
| Confianza | Tasa de disputas; % cerradas sin intervención; horas hasta el despacho | Menos del 3%; más del 80%; menos de 48 h |
| Retención | Compradores que repiten en 60 días; vendedores activos mensuales | Más del 25% |
| Ingreso | Take rate efectivo (comisión / GMV) | Según el modelo elegido |

---

## 8. Lo que necesito que completes o decidas

1. **Recursos:** quiénes trabajan, horas por semana, presupuesto mensual y fecha objetivo de lanzamiento (el plan asume una persona).
2. **Dominio:** ¿`tcg.ar` es tuyo y qué app está sirviendo? ¿Qué commit está desplegado en Vercel?
3. **Planes actuales** de Vercel y Supabase.
4. **Mercado Pago:** ¿hay contacto comercial? ¿La app OAuth está aprobada en modo productivo?
5. **Legal:** ¿hay sociedad constituida?
6. **Competencia:** ¿conocías Cartealo y Card Stash? ¿Hay algo que sepas de ellos que cambie el posicionamiento?
7. **Decisión de producto:** ¿aceptás congelar subastas, claims y trades para el lanzamiento?

---

## Anexos

### A. Capturas (375×812, build local sin backend)

| Pantalla | Archivo | Qué muestra |
|---|---|---|
| Home | [home-375.png](analisis-producto/home-375.png) | Primera pantalla solo con texto; header sin buscador ni "Ingresar"; botón pegado al logo |
| Mercado | [market-375.png](analisis-producto/market-375.png) | Error técnico crudo junto al estado vacío |
| Registro | [register-375.png](analisis-producto/register-375.png) | "Onboarding vendedor" para todos; checkbox chico |
| Trades | [trades-375.png](analisis-producto/trades-375.png) | Copy sin tildes; contadores en cero |
| Cómo funciona | [how-375.png](analisis-producto/how-375.png) | Marca "TCG" en el título |

### B. Consultas a producción

Solo conteos agregados y metadatos de esquema (`pg_class`, `pg_policies`, `information_schema`) más el advisor de seguridad de Supabase. No se leyeron datos personales.

### C. Fuentes

- Estafas y falsificaciones: [Bitdefender](https://www.bitdefender.com/es-es/blog/hotforsecurity/estafas-con-cartas-pokemon-2026) · [WeLiveSecurity](https://www.welivesecurity.com/la-es/2022/10/25/estafadores-venden-figuritas-marketplace-utilizando-nombre-direccion-comercios-legitimos/) · [Pokémon Price Tracker](https://www.pokemonpricetracker.com/guides/avoiding-pokemon-card-scams)
- Competidores: [Cartealo](https://cartealo.com/) · [Cartealo comisiones](https://cartealo.com/comisiones) · [Cartealo cómo funciona](https://cartealo.com/como-funciona) · [Card Stash](https://cardstash.ar/) · [MiEspacioTCG](https://miespaciotcg.com/) · [TCG FANS](https://tcg.fans/pokemon/about-us) · [CardTrader](https://www.cardtrader.com/en-US)
- Mercado Pago: [Link de pago (tarifas)](https://www.mercadopago.com.ar/herramientas-para-vender/link-de-pago) · [Checkout (tarifas)](https://www.mercadopago.com.ar/herramientas-para-vender/check-out) · [Split 1:1](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace) · [Split 1:N](https://www.mercadopago.com.br/developers/en/docs/split-payments-1-n/overview) · [Compra protegida (blog MX)](https://www.mercadopago.com.mx/blog/compra-protegida-mercado-pago-como-reclamar)
- Mercado Libre (fuente secundaria): [Guía de comisiones 2026](https://app.spomsolutions.com/blog/comisiones-mercadolibre-guia-2026)
- Legal: [Almirón c/ Mercado Libre](https://abogados.com.ar/el-rol-de-la-plataformas-en-la-cadena-de-comercializacion-un-analisis-del-caso-almiron-cmercado-libre/39415) · [Diario Judicial: "no fue solo intermediario"](https://www.diariojudicial.com/news-102984-mercado-libre-no-fue-solo-intermediario) · [Diario Judicial: multa por cobertura](https://www.diariojudicial.com/news-84652-mercado-no-libre-de-multa)
- Aduana: [KPMG sobre RG 5883 y 5884/2026](https://kpmg.com/us/en/taxnewsflash/news/2026/07/argentina-updated-postal-shipment-rules-courier-regime.html)
- Escena competitiva: [Special Championships Buenos Aires](https://culturageek.com.ar/pokemon-special-championships-buenos-aires-2026-agoto-en-tiempo-record-todos-los-cupos-para-la-competencia/) · [Victory Road](https://victoryroad.pro/2026-buenos-aires) · [Argentinos clasificados al Mundial 2026](https://culturageek.com.ar/los-argentinos-clasificados-al-pokemon-world-championship-2026/)
- Infraestructura (fuentes secundarias): [Vercel](https://modelence.com/compare/vercel-pricing) · [Supabase](https://makerkit.dev/blog/saas/supabase-pricing) · [Resend](https://automationatlas.io/answers/resend-pricing-explained-2026/)
