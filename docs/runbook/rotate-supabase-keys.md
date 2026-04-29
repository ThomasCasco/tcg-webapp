# Runbook: Rotar claves de Supabase

**Audiencia:** Operador / DevOps  
**Tiempo estimado:** 15–30 minutos  
**Impacto:** Interrupción breve durante el redeploy (< 60 s en Vercel con zero-downtime)

---

## ¿Cuándo rotar?

- Sospecha de filtración de claves (commits, logs, screenshots)
- Rotación periódica de seguridad (recomendado: cada 90 días)
- Offboarding de colaboradores con acceso a las variables de entorno
- Incidente de seguridad en la infraestructura de Supabase o Vercel

---

## Variables involucradas

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública del proyecto (no secreta, pero se cambia si se migra de proyecto) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT para acceso público con RLS habilitado |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT de service role (bypasa RLS — **nunca exponer al cliente**) |
| `SUPABASE_JWT_SECRET` | Secreto HMAC para verificar tokens de usuario (solo si usás auth custom) |

---

## Pasos

### 1. Generá las nuevas claves en Supabase Dashboard

1. Ingresá a [app.supabase.com](https://app.supabase.com) → tu proyecto → **Settings → API**
2. Hacé clic en **"Generate new API keys"** (o buscá el botón de rotación en la sección API Keys)
3. Copiá los nuevos valores:
   - `anon` (public key) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
4. Si también rotás el JWT Secret: **Settings → Auth → JWT Settings → Rotate JWT Secret**
   - ⚠️ Rotar el JWT Secret invalida **todas** las sesiones de usuario activas al instante.

> **Nota:** El `NEXT_PUBLIC_SUPABASE_URL` solo cambia si migrás de proyecto. No lo rotés por defecto.

---

### 2. Actualizá las variables de entorno en Vercel

```bash
# Usando la CLI de Vercel (recomendado para no tocar la UI)
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Pegá el nuevo valor cuando se pida

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Pegá el nuevo valor cuando se pida
```

O hacelo desde la UI: **Vercel Dashboard → tu proyecto → Settings → Environment Variables**.

---

### 3. Redeploy

```bash
# Forzá un redeploy para que las nuevas variables se inyecten
vercel --prod
```

O desde la UI de Vercel: **Deployments → último deploy → "Redeploy"**.

---

### 4. Verificá que la app funciona

- Abrí `/market` — debe cargar publicaciones sin errores.
- Intentá iniciar sesión con un usuario de prueba.
- Revisá los logs en Vercel y Supabase para confirmar que no hay errores 401/403.

---

### 5. Revocá las claves anteriores

En Supabase Dashboard → **Settings → API → Revoke old keys** (si el botón aparece después de la rotación).

Si no hay botón explícito, las claves viejas quedan inválidas automáticamente al regenerar.

---

### 6. Actualizá `.env.local` en máquinas de desarrollo

Notificá a cada desarrollador que actualice su archivo `.env.local`:

```bash
# En cada máquina de desarrollador:
# 1. Obtener las nuevas claves desde Vercel / 1Password / secreto compartido seguro
# 2. Editar .env.local:
NEXT_PUBLIC_SUPABASE_ANON_KEY=nueva_clave_aqui
SUPABASE_SERVICE_ROLE_KEY=nueva_service_role_aqui
```

---

## Checklist rápido

- [ ] Nuevas claves generadas en Supabase Dashboard
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` actualizada en Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` actualizada en Vercel
- [ ] Redeploy exitoso
- [ ] Login y carga de datos verificados en producción
- [ ] Claves anteriores revocadas en Supabase
- [ ] Desarrolladores notificados para actualizar `.env.local`
- [ ] Registro del incidente/rotación en el canal de ops (fecha, motivo, operador)

---

## Si algo sale mal

### Error 401 en el cliente

Las variables `NEXT_PUBLIC_*` se embeben en el bundle del cliente durante el build. Si actualizaste las env vars pero no hiciste redeploy, el cliente sigue usando las viejas. **Solución: redeploy inmediato.**

### Usuarios deslogueados masivamente

Ocurre solo si rotaste el `SUPABASE_JWT_SECRET`. Los tokens anteriores son inválidos. Los usuarios deben volver a iniciar sesión. **No hay rollback para esto**: es el comportamiento esperado.

### RLS falla con service_role

Si el `SUPABASE_SERVICE_ROLE_KEY` en el servidor no coincide con el de Supabase, las rutas que usan el cliente de servicio (webhooks, jobs, admin endpoints) van a fallar con 403. Verificá que las variables en Vercel estén actualizadas y hacé redeploy.

---

## Notas de seguridad

- **NUNCA** commitees claves en el repositorio. Usá `.env.local` para desarrollo (está en `.gitignore`).
- **NUNCA** pases `SUPABASE_SERVICE_ROLE_KEY` a componentes del cliente (`"use client"`).
- Las claves de Supabase son JWTs firmados — si se filtran, son válidas hasta que las revocás. Actuar rápido importa.
- Guardá las claves en un gestor de secretos (1Password, Doppler, Vercel Secrets) — no en Slack/email.
