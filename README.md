# GNERAI Finance

App interna de gestión financiera para los dos socios de GNERAI.

## Estado actual (etapa 1: setup + login)

- Next.js 14 con App Router + TypeScript + Tailwind
- Supabase (Auth con magic link, schema con RLS)
- shadcn/ui (componentes base instalados manualmente)
- Allowlist de emails autorizados
- Layout protegido con sesión SSR

## Puesta en marcha (paso a paso)

### 1. Crear el proyecto en Supabase

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el contenido de `supabase/migrations/0001_init.sql`.
3. En **Authentication → URL Configuration**, añade en *Redirect URLs*:
   - `http://localhost:3000/auth/callback`
   - `https://<tu-dominio>/auth/callback` (cuando despliegues)
4. En **Authentication → Email Templates**, opcionalmente personaliza el "Magic Link".

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Y rellena:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API).
- `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → service_role; **nunca** expongas esto al cliente).
- `ALLOWED_EMAILS` ya viene con los dos emails por defecto; ajusta si lo necesitas.

### 3. Instalar y arrancar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), introduce uno de los emails autorizados y revisa el correo para el magic link.

### 4. Crear los perfiles de socio

**Importante: el orden correcto es migración → login de los dos → seed.**

1. Asegúrate de que `0001_init.sql` ya se ha ejecutado.
2. Cada socio inicia sesión una vez con su magic link (esto crea su fila en `auth.users`).
3. Ejecuta `supabase/seed.sql` en el SQL Editor — busca los UUIDs por email automáticamente, no hay que tocar nada.

Si lanzas el seed antes de que ambos hayan iniciado sesión, simplemente no insertará al que falte y al final solo verás un socio en la tabla `users`. En ese caso, vuelve a ejecutarlo cuando el otro entre.

## Estructura

```
app/
  (auth)/login/        — magic link + server actions
  (app)/dashboard/     — placeholder, layout protegido
  auth/callback/       — exchange del magic link
  auth/no-autorizado/  — pantalla para emails no autorizados
lib/
  auth/allowlist.ts    — control de emails permitidos
  supabase/            — clientes server, browser, service y middleware
middleware.ts          — protege rutas y refresca la sesión
supabase/
  migrations/0001_init.sql
  seed.sql
```

## Telegram (opcional pero recomendado)

Las notificaciones automáticas usan un bot de Telegram. Es opcional: si no
configuras `TELEGRAM_BOT_TOKEN`, los crons funcionan igual pero sin avisos.

### 1. Crear el bot

1. Habla con [@BotFather](https://t.me/BotFather) en Telegram → `/newbot`.
2. Apunta el `bot token` que te dé.
3. En `.env.local` (y en Vercel), define `TELEGRAM_BOT_TOKEN`.

### 2. Obtener el `chat_id` de cada socio

Cada socio tiene que hablar con el bot **al menos una vez** (`/start`). Después:

```bash
curl "https://api.telegram.org/bot<TU_TOKEN>/getUpdates"
```

En la respuesta busca `"chat":{"id":XXXXXXXX,...}`. Ese número va al campo
`telegram_chat_id` de la fila del socio en la tabla `users`. Por SQL:

```sql
update public.users set telegram_chat_id = '123456789'
where email = 'msanjuan@gnerai.com';
```

### 3. Eventos que notifica

- 📄 Factura recurrente generada por el cron diario.
- ✅ Factura marcada como cobrada.
- ⚠️ Facturas que pasaron a `overdue` esta noche.

## Crons (Vercel)

Hay dos crons configurados en `vercel.json`:

- `/api/cron/recurrencias` — diario a las 07:00 UTC. Busca facturas con
  `recurrence != 'unique'` cuyo `next_due_date` ya llegó, crea una nueva
  factura como copia (heredando líneas, importes, cliente) y avanza el
  `next_due_date` del template al siguiente periodo.
- `/api/cron/vencimientos` — diario a las 07:30 UTC. Cambia las facturas
  `sent` cuyo vencimiento ya pasó a `overdue` y manda un resumen al emisor
  por Telegram.

### Protección

En Vercel, define la env var `CRON_SECRET` y el scheduler añadirá
automáticamente `Authorization: Bearer <CRON_SECRET>` a las llamadas. Las
rutas devuelven 401 si el header no coincide.

En desarrollo local puedes dejar `CRON_SECRET` vacío y disparar los crons
manualmente:

```bash
curl http://localhost:3000/api/cron/recurrencias
curl http://localhost:3000/api/cron/vencimientos
```

O con el secret:

```bash
curl -H "Authorization: Bearer <SECRET>" http://localhost:3000/api/cron/recurrencias
```

## Próximos pasos

Ver el roadmap en la spec del proyecto. Pendientes:

- Pre-rellenar el formulario de compensación interna.
- Detalle del cliente con histórico y semáforo de puntualidad.
- Exportaciones (CSV/Excel del trimestre).

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — sirve el build
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
