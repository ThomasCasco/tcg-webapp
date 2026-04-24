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

## Flujo de pago que usamos

1. Comprador toca "Reservar compra" en un listing.
   - El sistema marca el listing como `pending_payment` y crea un
     `transaction_id`.
2. Se muestran al comprador los datos de cobro del vendedor
   (alias MP / CBU / link de cobro).
3. Comprador paga **directo al vendedor** via Mercado Pago (u otro).
4. Comprador pega el `providerPaymentId` (ID de Mercado Pago) en la app.
5. Llamamos a la API de MP para **verificar** que ese pago existe y su
   estado es `approved`. La verificacion NO mueve plata: solo lee.
6. Si verifica, la transaccion pasa a `seller_confirmed` y el listing a
   `sold`. Si no, queda en `pending_review` para chequeo manual.
7. Post-venta: `shipped` -> `delivered`. Ambas partes confirman.
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

## Proveedores de pago soportados por el verifier

El endpoint `POST /api/payments/verify` acepta:

- `mercado_pago` (recomendado AR): ID de pago MP.
- `stripe` (para sellers internacionales): `payment_intent`.
- `external_link`: flujo manual (review humano).

El payload espera:

```json
{
  "transactionId": "tx_...",
   "providerPaymentId": "123456789"
}
```

El backend obtiene automaticamente el `provider` esperado desde la
transaccion reservada para evitar errores del cliente.

Para `mercado_pago` y `stripe`, el backend ignora cualquier status enviado
por cliente y consulta el proveedor por API en server-side. Solo
`external_link` mantiene flujo manual con `providerStatus` opcional.

Webhook firmado opcional: header `x-webhook-secret` con el valor de la
env `PAYMENT_WEBHOOK_SECRET`. Esto permite a MP/Stripe avisarnos
automaticamente cuando el pago se aprueba, en vez de depender del
comprador pegando el ID.

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

1. Integrar Mercado Pago **read-only**: token de MP (OAuth publico) para
   que la app consulte el pago y confirme `approved` automaticamente.
2. Agregar UI donde el seller pega su **CBU/alias MP** una sola vez, y
   nosotros lo mostramos al buyer al momento de reservar.
3. Terminos y condiciones visibles en el registro (checkbox obligatorio).
4. Badge "ID verificado" despues de subir DNI a Storage (moderacion manual
   al principio).
