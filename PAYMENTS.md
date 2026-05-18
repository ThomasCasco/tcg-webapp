# Estrategia de pagos (sin carga legal)

Este MVP NO toma custodia del dinero. Ese es el diseño clave para evitar
obligaciones como PSP (Proveedor de Servicios de Pago) en Argentina.

## Que somos y que no

| Somos                                  | No somos                        |
| -------------------------------------- | ------------------------------- |
| Clasificado / marketplace que conecta  | Pasarela de pagos               |
| Registra evidencia de transacciones    | Custodio de fondos (escrow real)|
| Emite reputacion y alertas             | Responsable del producto vendido|
| Ofrece proceso de disputa voluntario   | Arbitro legal obligatorio       |

Esto es equivalente al modelo de **Mercado Libre Classifieds** o **OLX**:
el pago lo hace el comprador **directo al vendedor**, y la plataforma
solo guarda la evidencia.

## Flujo de pago que usamos ahora

1. Comprador toca "Reservar compra" en un listing.
   - El sistema marca el listing como `pending_payment` y crea un
     `transaction_id`.
2. Si el vendedor conecto Mercado Pago, `POST /api/payments/checkout`
   crea una preferencia en la cuenta del vendedor con comision de plataforma.
3. Comprador paga en Mercado Pago. La plata va directo al vendedor; la
   plataforma no custodia fondos.
4. `POST /api/webhooks/mercadopago` valida la firma HMAC, lee el pago desde
   la API de MP y reconcilia la transaccion.
5. Si verifica, la transaccion pasa a `seller_confirmed` y el listing a
   `sold`. Si el webhook no llega, el redirect de exito y el cron de
   reconciliacion intentan cerrar el loop.
6. Si el vendedor no tiene MP conectado, queda el flujo P2P de respaldo con
   alias/CBU y revision manual.
7. Post-venta: `shipped` -> `delivered` -> rating/cierre.
8. Si algo falla: sistema de disputas (no vinculante, pero registra
   evidencia y afecta reputacion).

## Por que esto es legal sin registro BCRA

- No recibimos fondos de terceros. No hay "saldo" en la plataforma.
- No movemos plata entre personas. Solo leemos el estado de pagos que
  ya ocurrieron en MP.
- La evidencia que guardamos es: `providerPaymentId`, status, timestamp,
  confirmaciones de ambas partes, tracking.

Si en el futuro queremos custodia real (plata retenida hasta
confirmacion del comprador), hay que integrarse como **Mercado Pago
Marketplace** (split payments). Eso requiere:
- Razon social registrada en Argentina.
- Cuenta MP de empresa con permisos de marketplace.
- Compliance AML/KYC del lado del proveedor de pagos (ellos lo hacen).
- Comision de MP (~5-7% + IVA). 

Antes de ir a custodia, hay que validar que la gente pague los $500 ARS
de comision por transaccion que se descuenta de algun lado.

## Como se "siente" seguro sin escrow

El comprador paga un desconocido. Para que no duela:

1. **Reputacion pegada al vendedor** (tier `new` / `trusted` / `elite`).
   Un vendedor `elite` con 50+ operaciones no tiene incentivo a estafar.
2. **Verificacion de ID del vendedor** (en una siguiente etapa):
   subir foto de DNI en Supabase Storage y marcar el handle como
   `verified`. El comprador ve el badge.
3. **Hold informal**: pedimos al vendedor que NO envie hasta que vea
   `verified` la transaccion. Si el pago nunca llega, el listing vuelve
   a `active` despues de 24h.
4. **Confirmacion mutua explicita**:
   - Seller confirma que recibio el pago.
   - Buyer confirma que recibio la carta.
   - Si el buyer nunca confirma en 7 dias, se cierra automaticamente.
5. **Disputas registradas afectan reputacion**. Bajar de `trusted` a
   `new` es caro: te hace perder operaciones futuras.
6. **Alertas de fraude**: mismo buyer abriendo disputas contra muchos
   sellers -> se suspende. Vendedor con >10% de disputas -> suspendido.

## Proveedores de pago soportados

El flujo principal es Mercado Pago automatico:

- `POST /api/auth/mercadopago` inicia OAuth para el vendedor.
- `POST /api/payments/checkout` crea la preferencia MP con `external_reference`.
- `POST /api/webhooks/mercadopago` valida firma y reconcilia.
- `GET /api/cron/reconcile-mp-payments` y `GET /api/cron/daily` cubren pagos
  pendientes si el webhook falla.

`POST /api/payments/verify` queda como fallback legacy/manual para revisar
transacciones puntuales. El endpoint admin
`POST /api/admin/payments/manual-verify` esta protegido por `ADMIN_SECRET`.

Stripe no es parte del flujo v1 Argentina.

## Checklist legal mínimo para salir vivos

- [ ] Terminos y Condiciones (borrador en [/terms](/terms)) que
      declaran: plataforma es clasificado, no custodia, no responsable
      por producto.
- [ ] Politica de privacidad: que datos guardamos y por que (DNI opcional,
      historial, IP para rate-limit).
- [ ] Defensa del consumidor (Ley 24.240): cualquier venta en Argentina
      esta bajo esa ley. Nosotros NO somos el vendedor, pero debemos
      facilitar reclamos -> eso lo hace el sistema de disputas.
- [ ] AFIP: los vendedores intensivos deberian estar en monotributo.
      Podemos alertar a sellers con >5 ventas/mes para que regularicen,
      pero NO somos responsables de su situacion fiscal.
- [ ] Edad minima 18 (las cartas son de coleccion, no hay tema, pero
      contratar requiere mayoria de edad).

## Siguientes pasos recomendados

1. Panel admin para ver webhooks fallidos, pagos pendientes y verificacion manual.
2. Evidencia de disputas con adjuntos en Supabase Storage.
3. Automatizar alertas antifraude para sellers/buyers con demasiadas disputas.
4. Badge "ID verificado" despues de subir DNI a Storage (moderacion manual
   al principio).
