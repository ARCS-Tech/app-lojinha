# Access Logs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar aba "Logs de Acesso" no admin que registra cada abertura do mini-app (autenticação via Telegram initData) com IP, user-agent e usuário, exibindo mapa de calor por país e tabela paginada.

**Architecture:** Novo model `AccessLog` no Prisma armazena IP bruto + user-agent + FK para o usuário após cada auth bem-sucedida no endpoint `POST /auth/telegram`. Um cron diário limpa registros com mais de 30 dias. O frontend admin resolve geolocalização por IP via `ip-api.com` de forma lazy, agrega por país para o mapa de calor, e exibe tabela paginada com filtros.

**Tech Stack:** Fastify 4, Prisma 6, PostgreSQL, node-cron, React 19, TanStack Query v5, react-simple-maps, ip-api.com (free, no key)

---

## File Map

| Ação | Arquivo |
|------|---------|
| Modify | `backend/prisma/schema.prisma` |
| Modify | `backend/tests/helpers/fixtures.ts` |
| Modify | `backend/tests/auth.test.ts` |
| Modify | `backend/src/routes/auth.ts` |
| Create | `backend/src/routes/admin/access-logs.ts` |
| Modify | `backend/tests/admin.test.ts` |
| Modify | `backend/src/index.ts` |
| Create | `admin/src/hooks/useAdminAccessLogs.ts` |
| Create | `admin/src/lib/countryCodeMap.ts` |
| Create | `admin/src/pages/access-logs/AccessLogs.tsx` |
| Modify | `admin/src/components/Layout.tsx` |
| Modify | `admin/src/App.tsx` |

---

## Task 1: Prisma schema — modelo AccessLog

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/tests/helpers/fixtures.ts`

- [ ] **Step 1: Adicionar o modelo AccessLog no schema**

Em `backend/prisma/schema.prisma`, adicionar ao final (antes do fechamento do arquivo) e adicionar `accessLogs` ao modelo `User`:

```prisma
// Dentro do model User, adicionar após a linha "orders Order[]":
accessLogs AccessLog[]

// Novo model ao final do arquivo:
model AccessLog {
  id        Int      @id @default(autoincrement())
  ip        String
  userAgent String?
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  @@index([createdAt])
  @@index([ip])
  @@map("access_logs")
}
```

- [ ] **Step 2: Gerar e aplicar a migration**

```bash
cd backend
npx prisma migrate dev --name add-access-logs
```

Resultado esperado: `✔ Generated Prisma Client` e nova pasta em `prisma/migrations/`.

- [ ] **Step 3: Atualizar cleanDb para incluir accessLog**

Em `backend/tests/helpers/fixtures.ts`, adicionar `accessLog.deleteMany()` **antes** de `user.deleteMany()` (FK constraint):

```ts
export async function cleanDb() {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.accessLog.deleteMany()   // ← novo
  await prisma.productMedia.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.city.deleteMany()
  await prisma.user.deleteMany()
  await prisma.storeSetting.deleteMany()
}
```

- [ ] **Step 4: Verificar que os testes existentes ainda passam**

```bash
cd backend
npm test
```

Resultado esperado: todos os testes passando.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/ backend/tests/helpers/fixtures.ts
git commit -m "feat: add AccessLog prisma model"
```

---

## Task 2: Backend — registrar acesso no endpoint de auth

**Files:**
- Modify: `backend/tests/auth.test.ts`
- Modify: `backend/src/routes/auth.ts`

- [ ] **Step 1: Escrever o teste que falha**

Em `backend/tests/auth.test.ts`, adicionar dentro do `describe('POST /auth/telegram', ...)`:

```ts
it('creates an access log on successful auth', async () => {
  const initData = buildValidInitData(process.env.BOT_TOKEN ?? 'test-token', 777)
  const res = await app.inject({
    method: 'POST',
    url: '/auth/telegram',
    body: { initData },
    headers: { 'user-agent': 'TelegramBot/Test' },
  })
  expect(res.statusCode).toBe(200)

  // Aguardar a gravação fire-and-forget
  await new Promise((r) => setTimeout(r, 50))

  const { prisma: testPrisma } = await import('./helpers/fixtures.js')
  const logs = await testPrisma.accessLog.findMany({ where: { user: { telegramId: BigInt(777) } } })
  expect(logs).toHaveLength(1)
  expect(logs[0].userAgent).toBe('TelegramBot/Test')
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
cd backend
npm test -- --reporter=verbose tests/auth.test.ts
```

Resultado esperado: FAIL — `creates an access log on successful auth`

- [ ] **Step 3: Implementar o log de acesso em auth.ts**

Em `backend/src/routes/auth.ts`, após a linha `const token = signUserToken(user.id)` (antes do `return reply.send`), adicionar a gravação fire-and-forget:

```ts
// Fire-and-forget — não bloqueia a resposta
app.prisma.accessLog.create({
  data: {
    ip: req.ip,
    userAgent: req.headers['user-agent'] ?? null,
    userId: user.id,
  },
}).catch((err) => app.log.warn({ err }, 'Failed to write access log'))
```

O bloco completo do handler após as mudanças fica:

```ts
const token = signUserToken(user.id)

app.prisma.accessLog.create({
  data: {
    ip: req.ip,
    userAgent: req.headers['user-agent'] ?? null,
    userId: user.id,
  },
}).catch((err) => app.log.warn({ err }, 'Failed to write access log'))

return reply.send({ token, user: { ...user, telegramId: user.telegramId.toString() } })
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

```bash
cd backend
npm test -- --reporter=verbose tests/auth.test.ts
```

Resultado esperado: todos os testes PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/auth.ts backend/tests/auth.test.ts
git commit -m "feat: log access on telegram auth"
```

---

## Task 3: Backend — rota admin GET /admin/access-logs

**Files:**
- Create: `backend/src/routes/admin/access-logs.ts`
- Modify: `backend/tests/admin.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Em `backend/tests/admin.test.ts`, adicionar no bloco `describe('Admin API', ...)`:

```ts
it('GET /admin/access-logs returns 401 without token', async () => {
  expect((await app.inject({ method: 'GET', url: '/admin/access-logs' })).statusCode).toBe(401)
})

it('GET /admin/access-logs returns empty list when no logs', async () => {
  const res = await app.inject({ method: 'GET', url: '/admin/access-logs', headers: adminHeaders })
  expect(res.statusCode).toBe(200)
  expect(res.json().data).toEqual([])
  expect(res.json().total).toBe(0)
})

it('GET /admin/access-logs returns logs with pagination', async () => {
  const { prisma: testPrisma, createUser } = await import('./helpers/fixtures.js')
  const user = await createUser()
  await testPrisma.accessLog.createMany({
    data: [
      { ip: '1.2.3.4', userAgent: 'Mozilla/5.0', userId: user.id },
      { ip: '5.6.7.8', userAgent: 'TelegramBot', userId: user.id },
    ],
  })
  const res = await app.inject({
    method: 'GET',
    url: '/admin/access-logs?page=1&limit=10',
    headers: adminHeaders,
  })
  expect(res.statusCode).toBe(200)
  expect(res.json().data).toHaveLength(2)
  expect(res.json().total).toBe(2)
  expect(res.json().totalPages).toBe(1)
})

it('GET /admin/access-logs filters by ip', async () => {
  const { prisma: testPrisma } = await import('./helpers/fixtures.js')
  await testPrisma.accessLog.createMany({
    data: [{ ip: '1.2.3.4' }, { ip: '9.9.9.9' }],
  })
  const res = await app.inject({
    method: 'GET',
    url: '/admin/access-logs?ip=1.2',
    headers: adminHeaders,
  })
  expect(res.statusCode).toBe(200)
  expect(res.json().data).toHaveLength(1)
  expect(res.json().data[0].ip).toBe('1.2.3.4')
})
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

```bash
cd backend
npm test -- --reporter=verbose tests/admin.test.ts
```

Resultado esperado: os 4 novos testes FAIL com "Not Found" ou similar.

- [ ] **Step 3: Criar a rota `backend/src/routes/admin/access-logs.ts`**

```ts
import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminAccessLogsRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async (req) => {
    const {
      page = '1',
      limit = '25',
      from,
      to,
      ip,
      userId,
    } = req.query as {
      page?: string
      limit?: string
      from?: string
      to?: string
      ip?: string
      userId?: string
    }

    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum

    const where = {
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(ip ? { ip: { contains: ip } } : {}),
      ...(userId ? { userId } : {}),
    }

    const [total, logs] = await Promise.all([
      app.prisma.accessLog.count({ where }),
      app.prisma.accessLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, username: true, telegramId: true },
          },
        },
      }),
    ])

    return {
      data: logs.map(({ user, ...log }) => ({
        ...log,
        user: user ? { ...user, telegramId: user.telegramId.toString() } : null,
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    }
  })
}

export default adminAccessLogsRoute
```

- [ ] **Step 4: Registrar a rota em `backend/src/index.ts`**

Adicionar o import e o registro (junto aos outros admin routes):

```ts
// import no topo:
import adminAccessLogsRoute from './routes/admin/access-logs.js'

// no corpo de buildApp(), após adminSettingsRoute:
app.register(adminAccessLogsRoute, { prefix: '/admin/access-logs' })
```

- [ ] **Step 5: Rodar os testes para confirmar que passam**

```bash
cd backend
npm test -- --reporter=verbose tests/admin.test.ts
```

Resultado esperado: todos os testes PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/admin/access-logs.ts backend/src/index.ts backend/tests/admin.test.ts
git commit -m "feat: add GET /admin/access-logs route"
```

---

## Task 4: Backend — trustProxy + cron de limpeza

**Files:**
- Modify: `backend/src/index.ts`
- Modify: `backend/package.json` (dependência node-cron)

- [ ] **Step 1: Instalar node-cron**

```bash
cd backend
npm install node-cron
npm install -D @types/node-cron
```

- [ ] **Step 2: Adicionar trustProxy e cron em `backend/src/index.ts`**

O arquivo final de `backend/src/index.ts` fica:

```ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cron from 'node-cron'
import prismaPlugin from './plugins/prisma.js'
import authRoute from './routes/auth.js'
import citiesRoute from './routes/cities.js'
import categoriesRoute from './routes/categories.js'
import productsRoute from './routes/products.js'
import ordersRoute from './routes/orders.js'
import settingsRoute from './routes/settings.js'
import adminProductsRoute from './routes/admin/products.js'
import adminOrdersRoute from './routes/admin/orders.js'
import adminCitiesRoute from './routes/admin/cities.js'
import adminCategoriesRoute from './routes/admin/categories.js'
import adminSettingsRoute from './routes/admin/settings.js'
import adminAccessLogsRoute from './routes/admin/access-logs.js'
import usersRoute from './routes/users.js'

export function buildApp() {
  const app = Fastify({ logger: true, trustProxy: true })

  app.register(cors, { origin: true })
  app.register(prismaPlugin)

  app.register(authRoute, { prefix: '/auth' })
  app.register(citiesRoute, { prefix: '/cities' })
  app.register(categoriesRoute, { prefix: '/categories' })
  app.register(productsRoute, { prefix: '/products' })
  app.register(ordersRoute, { prefix: '/orders' })
  app.register(settingsRoute, { prefix: '/settings' })
  app.register(usersRoute, { prefix: '/users' })

  app.register(adminProductsRoute, { prefix: '/admin/products' })
  app.register(adminOrdersRoute, { prefix: '/admin/orders' })
  app.register(adminCitiesRoute, { prefix: '/admin/cities' })
  app.register(adminCategoriesRoute, { prefix: '/admin/categories' })
  app.register(adminSettingsRoute, { prefix: '/admin/settings' })
  app.register(adminAccessLogsRoute, { prefix: '/admin/access-logs' })

  return app
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const app = buildApp()

  // Limpeza diária às 03:00 — remove logs com mais de 30 dias
  cron.schedule('0 3 * * *', async () => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await app.prisma.accessLog.deleteMany({ where: { createdAt: { lt: cutoff } } })
    app.log.info('Access logs cleanup completed')
  })

  await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
}
```

- [ ] **Step 3: Rodar todos os testes para confirmar que nada quebrou**

```bash
cd backend
npm test
```

Resultado esperado: todos os testes PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/index.ts backend/package.json backend/package-lock.json
git commit -m "feat: add trustProxy and 30-day access log cleanup cron"
```

---

## Task 5: Admin — hook de dados e mapa de países

**Files:**
- Create: `admin/src/hooks/useAdminAccessLogs.ts`
- Create: `admin/src/lib/countryCodeMap.ts`

- [ ] **Step 1: Criar `admin/src/hooks/useAdminAccessLogs.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AccessLogUser {
  id: string
  firstName: string
  username: string | null
  telegramId: string
}

export interface AdminAccessLog {
  id: number
  ip: string
  userAgent: string | null
  createdAt: string
  user: AccessLogUser | null
}

export interface AccessLogsResponse {
  data: AdminAccessLog[]
  total: number
  page: number
  totalPages: number
}

export interface AccessLogFilters {
  page?: number
  limit?: number
  from?: string
  to?: string
  ip?: string
  userId?: string
}

export function useAdminAccessLogs(filters: AccessLogFilters = {}) {
  return useQuery<AccessLogsResponse>({
    queryKey: ['admin', 'access-logs', filters],
    queryFn: async () =>
      (await api.get('/admin/access-logs', { params: filters })).data,
  })
}
```

- [ ] **Step 2: Criar `admin/src/lib/countryCodeMap.ts`**

Este arquivo mapeia o código alpha-2 retornado pelo ip-api.com para o ID numérico usado pelo world-atlas (necessário para colorir o mapa SVG):

```ts
// ISO 3166-1: alpha-2 → numeric (world-atlas geo.id)
export const ALPHA2_TO_NUMERIC: Record<string, number> = {
  AF: 4, AL: 8, DZ: 12, AD: 20, AO: 24, AG: 28, AR: 32, AM: 51, AU: 36,
  AT: 40, AZ: 31, BS: 44, BH: 48, BD: 50, BB: 52, BY: 112, BE: 56, BZ: 84,
  BJ: 204, BT: 64, BO: 68, BA: 70, BW: 72, BR: 76, BN: 96, BG: 100, BF: 854,
  BI: 108, CV: 132, KH: 116, CM: 120, CA: 124, CF: 140, TD: 148, CL: 152,
  CN: 156, CO: 170, KM: 174, CG: 178, CD: 180, CR: 188, HR: 191, CU: 192,
  CY: 196, CZ: 203, DK: 208, DJ: 262, DM: 212, DO: 214, EC: 218, EG: 818,
  SV: 222, GQ: 226, ER: 232, EE: 233, SZ: 748, ET: 231, FJ: 242, FI: 246,
  FR: 250, GA: 266, GM: 270, GE: 268, DE: 276, GH: 288, GR: 300, GD: 308,
  GT: 320, GN: 324, GW: 624, GY: 328, HT: 332, HN: 340, HU: 348, IS: 352,
  IN: 356, ID: 360, IR: 364, IQ: 368, IE: 372, IL: 376, IT: 380, JM: 388,
  JP: 392, JO: 400, KZ: 398, KE: 404, KI: 296, KP: 408, KR: 410, KW: 414,
  KG: 417, LA: 418, LV: 428, LB: 422, LS: 426, LR: 430, LY: 434, LI: 438,
  LT: 440, LU: 442, MG: 450, MW: 454, MY: 458, MV: 462, ML: 466, MT: 470,
  MH: 584, MR: 478, MU: 480, MX: 484, FM: 583, MD: 498, MC: 492, MN: 496,
  ME: 499, MA: 504, MZ: 508, MM: 104, NA: 516, NR: 520, NP: 524, NL: 528,
  NZ: 554, NI: 558, NE: 562, NG: 566, NO: 578, OM: 512, PK: 586, PW: 585,
  PA: 591, PG: 598, PY: 600, PE: 604, PH: 608, PL: 616, PT: 620, QA: 634,
  RO: 642, RU: 643, RW: 646, KN: 659, LC: 662, VC: 670, WS: 882, SM: 674,
  ST: 678, SA: 682, SN: 686, RS: 688, SC: 690, SL: 694, SG: 702, SK: 703,
  SI: 705, SB: 90, SO: 706, ZA: 710, SS: 728, ES: 724, LK: 144, SD: 729,
  SR: 740, SE: 752, CH: 756, SY: 760, TW: 158, TJ: 762, TZ: 834, TH: 764,
  TL: 626, TG: 768, TO: 776, TT: 780, TN: 788, TR: 792, TM: 795, TV: 798,
  UG: 800, UA: 804, AE: 784, GB: 826, US: 840, UY: 858, UZ: 860, VU: 548,
  VE: 862, VN: 704, YE: 887, ZM: 894, ZW: 716,
}

export interface GeoResult {
  countryCode: string
  country: string
  city: string
  status: 'success' | 'fail'
}

export async function resolveGeo(ip: string): Promise<GeoResult> {
  const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`)
  return res.json()
}
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/hooks/useAdminAccessLogs.ts admin/src/lib/countryCodeMap.ts
git commit -m "feat: add access logs hook and country code map"
```

---

## Task 6: Admin — página AccessLogs

**Files:**
- Create: `admin/src/pages/access-logs/AccessLogs.tsx`

- [ ] **Step 1: Instalar react-simple-maps**

```bash
cd admin
npm install react-simple-maps
npm install -D @types/react-simple-maps
```

- [ ] **Step 2: Criar `admin/src/pages/access-logs/AccessLogs.tsx`**

```tsx
import { useState, useEffect, useRef } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { useAdminAccessLogs, type AdminAccessLog } from '@/hooks/useAdminAccessLogs'
import { ALPHA2_TO_NUMERIC, resolveGeo, type GeoResult } from '@/lib/countryCodeMap'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function parseUserAgent(ua: string | null) {
  if (!ua) return '—'
  if (/iPhone|iPad/i.test(ua)) return 'iOS · Telegram'
  if (/Android/i.test(ua)) return 'Android · Telegram'
  if (/Windows/i.test(ua)) return 'Windows · Telegram Web'
  if (/Mac/i.test(ua)) return 'Mac · Telegram Web'
  return ua.slice(0, 40)
}

export default function AccessLogs() {
  const [page, setPage] = useState(1)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [ipFilter, setIpFilter] = useState('')
  const [activeFilters, setActiveFilters] = useState<{ from?: string; to?: string; ip?: string }>({})

  const { data, isLoading } = useAdminAccessLogs({ page, limit: 25, ...activeFilters })

  // Geo cache: ip → GeoResult
  const geoCache = useRef<Map<string, GeoResult>>(new Map())
  const [geoMap, setGeoMap] = useState<Map<string, GeoResult>>(new Map())

  // Lazy geo resolution for IPs not yet resolved
  useEffect(() => {
    if (!data) return
    const unresolvedIps = [...new Set(data.data.map((l) => l.ip))].filter(
      (ip) => !geoCache.current.has(ip)
    )
    unresolvedIps.forEach((ip) => {
      resolveGeo(ip)
        .then((result) => {
          geoCache.current.set(ip, result)
          setGeoMap(new Map(geoCache.current))
        })
        .catch(() => {
          geoCache.current.set(ip, { status: 'fail', countryCode: '', country: '', city: '' })
          setGeoMap(new Map(geoCache.current))
        })
    })
  }, [data])

  // Aggregate country counts across all currently resolved IPs
  const countByNumericId = new Map<number, number>()
  geoMap.forEach((geo) => {
    const numId = ALPHA2_TO_NUMERIC[geo.countryCode]
    if (numId) countByNumericId.set(numId, (countByNumericId.get(numId) ?? 0) + 1)
  })

  function getColor(numId: number) {
    const count = countByNumericId.get(numId) ?? 0
    if (count === 0) return '#e2e8f0'
    if (count <= 10) return '#bfdbfe'
    if (count <= 50) return '#60a5fa'
    if (count <= 200) return '#2563eb'
    return '#1e3a8a'
  }

  function applyFilters() {
    setPage(1)
    setActiveFilters({
      from: fromDate || undefined,
      to: toDate || undefined,
      ip: ipFilter || undefined,
    })
  }

  const logs = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  // Stats
  const uniqueIps = new Set(logs.map((l) => l.ip)).size
  const uniqueCountries = new Set([...geoMap.values()].map((g) => g.countryCode).filter(Boolean)).size
  const today = new Date().toDateString()
  const todayCount = logs.filter((l) => new Date(l.createdAt).toDateString() === today).length

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📡 Logs de Acesso</h1>
        <span className="text-sm text-gray-400">Últimos 30 dias</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de acessos', value: total },
          { label: 'IPs únicos', value: uniqueIps },
          { label: 'Países', value: uniqueCountries },
          { label: 'Hoje', value: todayCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Mapa */}
      <div className="bg-white border rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Distribuição geográfica
        </p>
        <ComposableMap projectionConfig={{ scale: 140 }} height={280}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getColor(Number(geo.id))}
                  stroke="#fff"
                  strokeWidth={0.4}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none', opacity: 0.8 }, pressed: { outline: 'none' } }}
                />
              ))
            }
          </Geographies>
        </ComposableMap>
        <div className="flex gap-4 mt-2 flex-wrap">
          {[
            { label: '1–10', color: '#bfdbfe' },
            { label: '11–50', color: '#60a5fa' },
            { label: '51–200', color: '#2563eb' },
            { label: '200+', color: '#1e3a8a' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Registros</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Filtrar por IP..."
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
            />
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="p-6 text-gray-400 text-sm">Carregando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Data / Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Localização</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Usuário Telegram</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <LogRow key={log.id} log={log} geo={geoMap.get(log.ip)} />
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nenhum registro encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Paginação */}
        <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
          <span>
            {total > 0
              ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)} de ${total} registros`
              : '0 registros'}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 border rounded-lg ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LogRow({ log, geo }: { log: AdminAccessLog; geo: GeoResult | undefined }) {
  const locationText = !geo
    ? null
    : geo.status === 'fail'
    ? '—'
    : `${geo.countryCode} · ${geo.city || geo.country}`

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(log.createdAt)}</td>
      <td className="px-4 py-3 font-mono text-xs">{log.ip}</td>
      <td className="px-4 py-3">
        {locationText !== null ? (
          <span className="text-xs text-gray-600">{locationText}</span>
        ) : (
          <span className="text-xs text-gray-300 italic">resolvendo...</span>
        )}
      </td>
      <td className="px-4 py-3">
        {log.user ? (
          <span className="text-sm">
            {log.user.firstName}
            {log.user.username ? (
              <span className="text-gray-400 text-xs"> @{log.user.username}</span>
            ) : null}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{parseUserAgent(log.userAgent)}</td>
    </tr>
  )
}
```

- [ ] **Step 3: Verificar que o projeto admin compila sem erros**

```bash
cd admin
npm run build
```

Resultado esperado: build sem erros de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/access-logs/ admin/package.json admin/package-lock.json
git commit -m "feat: add AccessLogs admin page with map and table"
```

---

## Task 7: Admin — rota e navegação

**Files:**
- Modify: `admin/src/components/Layout.tsx`
- Modify: `admin/src/App.tsx`

- [ ] **Step 1: Adicionar item na sidebar em `admin/src/components/Layout.tsx`**

Localizar o array `navItems` e adicionar a nova entrada antes de Configurações:

```ts
const navItems = [
  { to: '/products', label: '📦 Produtos' },
  { to: '/orders', label: '🧾 Pedidos' },
  { to: '/cities', label: '🏙️ Cidades' },
  { to: '/categories', label: '🗂️ Categorias' },
  { to: '/access-logs', label: '📡 Logs de Acesso' },  // ← novo
  { to: '/settings', label: '⚙️ Configurações' },
]
```

- [ ] **Step 2: Adicionar a rota em `admin/src/App.tsx`**

Adicionar o import e a rota dentro do bloco de rotas protegidas:

```tsx
// import no topo:
import AccessLogs from '@/pages/access-logs/AccessLogs'

// dentro do <Route element={<ProtectedRoute>...}>:
<Route path="access-logs" element={<AccessLogs />} />
```

- [ ] **Step 3: Verificar o build final**

```bash
cd admin
npm run build
```

Resultado esperado: build sem erros.

- [ ] **Step 4: Commit**

```bash
git add admin/src/components/Layout.tsx admin/src/App.tsx
git commit -m "feat: wire access logs route and sidebar nav"
```

---

## Task 8: Teste de fumaça manual

- [ ] **Step 1: Subir o backend em desenvolvimento**

```bash
cd backend
npm run dev
```

- [ ] **Step 2: Abrir o admin e verificar a nova aba**

Navegar para `http://localhost:5173` (ou a porta do Vite), fazer login, clicar em **📡 Logs de Acesso**.

Verificar:
- Stats cards aparecem (mesmo que com 0)
- Mapa do mundo carrega
- Tabela aparece vazia ou com dados existentes

- [ ] **Step 3: Simular um acesso ao mini-app**

Fazer uma chamada manual ao endpoint de auth para gerar um log:

```bash
curl -X POST http://localhost:3000/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData":"dev:{\"id\":12345,\"first_name\":\"Teste\"}"}'
```

Recarregar a página de logs e verificar que o registro aparece.

- [ ] **Step 4: Verificar resolução de geo**

Na tabela, a coluna Localização deve mostrar "resolvendo..." por um breve instante e depois exibir o país/cidade resolvido via ip-api.com.
