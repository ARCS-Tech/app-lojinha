# Access Logs — Design Spec

**Date:** 2026-04-26  
**Status:** Approved  

## Overview

Add an "Access Logs" tab to the admin panel showing which IPs accessed the mini-app, when, and from where. Logs are captured on each Telegram `initData` authentication event, stored in PostgreSQL, and automatically purged after 30 days.

---

## Requirements

- Log every mini-app open event (triggered by `POST /auth` with valid Telegram initData)
- Store: IP, user-agent, Telegram user ID (FK), timestamp
- Retain logs for 30 days — automatic daily cleanup
- Admin UI: stats cards + world heatmap by country + paginated table with date/IP/user filters
- Geolocation resolved lazily on the frontend via `ip-api.com` (free, no key required, 1000 req/day)

---

## Architecture

```
Mini-App opens
    → POST /auth (Fastify)
        → validate initData
        → create/update user record
        → INSERT access_log (ip, userAgent, userId, createdAt)  ← NEW
        → return token

GET /admin/access-logs (protected)
    → paginated, filterable by date range / IP / userId
    → returns raw IPs (no geo)

Admin UI (AccessLogs.tsx)
    → on mount: fetch logs
    → for each unique IP not yet resolved: call ip-api.com lazily
    → render: stats cards + react-simple-maps heatmap + table

Daily cron (Fastify scheduler)
    → DELETE access_logs WHERE createdAt < NOW() - 30 days
```

---

## Data Model

New Prisma model added to `backend/prisma/schema.prisma`:

```prisma
model AccessLog {
  id        Int      @id @default(autoincrement())
  ip        String
  userAgent String?
  userId    Int?
  user      User?    @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  @@index([createdAt])
  @@index([ip])
  @@map("access_logs")
}
```

The `User` model also needs a back-relation field added:
```prisma
// inside model User:
accessLogs AccessLog[]
```

---

## Backend Changes

### 1. `backend/prisma/schema.prisma`
- Add `AccessLog` model (above)
- Add `accessLogs AccessLog[]` to `User` model

### 2. `backend/src/routes/auth.ts`
After successfully validating initData and upserting the user, insert an access log:

```ts
await prisma.accessLog.create({
  data: {
    ip: request.ip,
    userAgent: request.headers['user-agent'] ?? null,
    userId: user.id,
  },
})
```

Fastify must have `trustProxy: true` so `request.ip` resolves correctly behind Vercel/proxies.

### 3. `backend/src/routes/admin/access-logs.ts` (new file)
`GET /admin/access-logs` — protected by `requireAdmin` middleware.

Query params:
- `page` (default 1), `limit` (default 25, max 100)
- `from` / `to` — ISO date strings for date range filter
- `ip` — partial string match
- `userId` — exact match

Response shape:
```ts
{
  data: Array<{
    id: number
    ip: string
    userAgent: string | null
    createdAt: string
    user: { id: number; firstName: string; username: string | null } | null
  }>
  total: number
  page: number
  totalPages: number
}
```

### 4. `backend/src/index.ts`
- Add `trustProxy: true` to the Fastify constructor so `request.ip` resolves correctly behind Vercel/proxies:
  ```ts
  const app = Fastify({ logger: true, trustProxy: true })
  ```
- Register the new `access-logs` admin route
- Add daily cron job using `node-cron` (new dependency — `npm install node-cron` + `npm install -D @types/node-cron`):

```ts
import cron from 'node-cron'

cron.schedule('0 3 * * *', async () => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  await prisma.accessLog.deleteMany({ where: { createdAt: { lt: cutoff } } })
})
```

---

## Frontend — Admin Panel

### 5. `admin/src/components/Layout.tsx`
Add new sidebar item:
```tsx
{ path: '/access-logs', label: 'Logs de Acesso', icon: '📡' }
```

### 6. `admin/src/lib/api.ts`
Add fetch helper:
```ts
export const getAccessLogs = (params) => api.get('/admin/access-logs', { params })
```

### 7. `admin/src/pages/access-logs/AccessLogs.tsx` (new file)

**Sections:**
1. **Stats row** — 4 cards: Total acessos / IPs únicos / Países / Hoje
2. **World heatmap** — `react-simple-maps` SVG world map, countries colored by access count (4-tier scale: 1–10, 11–50, 51–200, 200+)
3. **Filters bar** — date range pickers + IP text input + Telegram username input + "Filtrar" button
4. **Paginated table** — columns: Data/Hora | IP | Localização | Usuário Telegram | Dispositivo

**Geo resolution (lazy):**
- Maintain a `Map<string, GeoResult>` in component state
- On each render, for each unique IP not yet in the map, fire `fetch('http://ip-api.com/json/<ip>?fields=country,countryCode,city')`
- Results are cached in state; no re-fetching on re-render
- Unresolved IPs show a "Resolver geo" button that triggers the lookup on click
- `ip-api.com` free tier: 1000 req/min (no key needed) — sufficient for admin use

**Dependencies to add:**
- `react-simple-maps` — SVG world map component

### 8. `admin/src/App.tsx`
Add route:
```tsx
<Route path="/access-logs" element={<AccessLogs />} />
```

---

## Error Handling

- Access log insert failure must NOT block the auth response — wrap in a fire-and-forget try/catch
- If `ip-api.com` is unavailable, show the raw IP with a retry button (no hard error)
- Admin route returns 400 for invalid date params, 401 if not authenticated

---

## Out of Scope

- Real-time updates (polling or WebSocket)
- Export to CSV
- Per-user access history drill-down
- Rate limiting or blocking by IP from the admin UI
