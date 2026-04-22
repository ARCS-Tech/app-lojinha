# Backend + Database — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full REST API backend with PostgreSQL database, Telegram auth validation, all public endpoints (cities, categories, products, orders), and protected admin endpoints.

**Architecture:** Node.js + Fastify server with Prisma ORM on PostgreSQL. Telegram Mini App users authenticate via HMAC-validated initData. Admins authenticate via a static secret token (MVP). All business logic lives in route handlers with thin service helpers.

**Tech Stack:** Node.js 20, TypeScript, Fastify 4, Prisma 5, PostgreSQL 15, Vitest, @fastify/jwt (admin), crypto (built-in, for Telegram HMAC)

---

## File Structure

```
backend/
├── src/
│   ├── index.ts                    # Server entry point, plugin registration
│   ├── lib/
│   │   ├── telegram-auth.ts        # initData HMAC-SHA256 validation
│   │   └── admin-auth.ts           # Admin token middleware
│   ├── plugins/
│   │   ├── prisma.ts               # Prisma client Fastify plugin
│   │   └── cors.ts                 # CORS configuration
│   └── routes/
│       ├── auth.ts                 # POST /auth/telegram
│       ├── cities.ts               # GET /cities
│       ├── categories.ts           # GET /categories
│       ├── products.ts             # GET /products, GET /products/:id
│       ├── orders.ts               # POST /orders/checkout, GET /orders/me, GET /orders/:id
│       └── admin/
│           ├── products.ts         # CRUD /admin/products
│           ├── orders.ts           # GET/PATCH /admin/orders
│           ├── cities.ts           # CRUD /admin/cities
│           └── settings.ts         # GET/PATCH /admin/settings
├── prisma/
│   └── schema.prisma
├── tests/
│   ├── helpers/
│   │   ├── app.ts                  # Test app factory (no listen)
│   │   └── fixtures.ts             # DB seed helpers for tests
│   ├── auth.test.ts
│   ├── cities.test.ts
│   ├── categories.test.ts
│   ├── products.test.ts
│   ├── orders.test.ts
│   └── admin.test.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `backend/src/index.ts`

- [ ] **Step 1: Create backend directory and package.json**

```bash
mkdir -p backend && cd backend
npm init -y
npm install fastify @fastify/cors @fastify/jwt @prisma/client
npm install -D typescript tsx vitest @types/node prisma
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Add scripts to package.json**

Replace `"scripts"` section:
```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:migrate": "prisma migrate dev",
  "db:generate": "prisma generate",
  "db:seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 4: Create .env.example**

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/lojinha_dev"
BOT_TOKEN="your-telegram-bot-token"
ADMIN_SECRET="your-admin-secret-token"
PORT=3000
```

Copy to `.env` and fill in real values before running.

- [ ] **Step 5: Create src/index.ts**

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import prismaPlugin from './plugins/prisma.js'
import authRoute from './routes/auth.js'
import citiesRoute from './routes/cities.js'
import categoriesRoute from './routes/categories.js'
import productsRoute from './routes/products.js'
import ordersRoute from './routes/orders.js'
import adminProductsRoute from './routes/admin/products.js'
import adminOrdersRoute from './routes/admin/orders.js'
import adminCitiesRoute from './routes/admin/cities.js'
import adminSettingsRoute from './routes/admin/settings.js'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(cors, { origin: true })
  app.register(prismaPlugin)

  app.register(authRoute, { prefix: '/auth' })
  app.register(citiesRoute, { prefix: '/cities' })
  app.register(categoriesRoute, { prefix: '/categories' })
  app.register(productsRoute, { prefix: '/products' })
  app.register(ordersRoute, { prefix: '/orders' })

  app.register(adminProductsRoute, { prefix: '/admin/products' })
  app.register(adminOrdersRoute, { prefix: '/admin/orders' })
  app.register(adminCitiesRoute, { prefix: '/admin/cities' })
  app.register(adminSettingsRoute, { prefix: '/admin/settings' })

  return app
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const app = buildApp()
  await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
}
```

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: bootstrap backend project structure"
```

---

## Task 2: Prisma Schema + Migration

**Files:**
- Create: `backend/prisma/schema.prisma`

- [ ] **Step 1: Initialize Prisma**

```bash
cd backend
npx prisma init
```

- [ ] **Step 2: Write schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id @default(cuid())
  telegramId     BigInt   @unique
  firstName      String
  lastName       String?
  username       String?
  languageCode   String?
  selectedCityId String?
  city           City?    @relation(fields: [selectedCityId], references: [id])
  orders         Order[]
  reviews        Review[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("users")
}

model City {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  users     User[]
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("cities")
}

model Category {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  isActive  Boolean   @default(true)
  sortOrder Int       @default(0)
  products  Product[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("categories")
}

model Product {
  id          String         @id @default(cuid())
  name        String
  slug        String         @unique
  description String?
  price       Decimal        @db.Decimal(10, 2)
  categoryId  String
  category    Category       @relation(fields: [categoryId], references: [id])
  isActive    Boolean        @default(true)
  media       ProductMedia[]
  orderItems  OrderItem[]
  reviews     Review[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@map("products")
}

model ProductMedia {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  type      String
  url       String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  @@map("product_media")
}

model Order {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  cityId      String
  city        City        @relation(fields: [cityId], references: [id])
  status      String      @default("submitted")
  totalAmount Decimal     @db.Decimal(10, 2)
  notes       String?
  items       OrderItem[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@map("orders")
}

model OrderItem {
  id                  String  @id @default(cuid())
  orderId             String
  order               Order   @relation(fields: [orderId], references: [id])
  productId           String
  product             Product @relation(fields: [productId], references: [id])
  productNameSnapshot String
  unitPriceSnapshot   Decimal @db.Decimal(10, 2)
  quantity            Int
  lineTotal           Decimal @db.Decimal(10, 2)

  @@map("order_items")
}

model Review {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  productId  String?
  product    Product? @relation(fields: [productId], references: [id])
  rating     Int
  comment    String?
  isApproved Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@map("reviews")
}

model StoreSetting {
  id                 String   @id @default(cuid())
  storeName          String   @default("Minha Loja")
  logoUrl            String?
  supportTelegramUrl String?
  defaultLanguage    String   @default("pt")
  welcomeText        String?
  updatedAt          DateTime @updatedAt

  @@map("store_settings")
}
```

- [ ] **Step 3: Run migration**

```bash
cd backend
npx prisma migrate dev --name init
```

Expected output: `✓ Generated Prisma Client` and migration file in `prisma/migrations/`

- [ ] **Step 4: Generate client**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/
git commit -m "feat: add prisma schema with all MVP models"
```

---

## Task 3: Prisma Plugin + Test Helpers

**Files:**
- Create: `backend/src/plugins/prisma.ts`
- Create: `backend/src/plugins/cors.ts`
- Create: `backend/tests/helpers/app.ts`
- Create: `backend/tests/helpers/fixtures.ts`

- [ ] **Step 1: Create src/plugins/prisma.ts**

```typescript
import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

export default fp(async (app) => {
  const prisma = new PrismaClient()
  await prisma.$connect()
  app.decorate('prisma', prisma)
  app.addHook('onClose', async () => prisma.$disconnect())
})
```

Install missing dep:
```bash
cd backend && npm install fastify-plugin
```

- [ ] **Step 2: Create tests/helpers/app.ts**

```typescript
import { buildApp } from '../../src/index.js'

export function getTestApp() {
  return buildApp()
}
```

- [ ] **Step 3: Create tests/helpers/fixtures.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanDb() {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.review.deleteMany()
  await prisma.productMedia.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.city.deleteMany()
  await prisma.user.deleteMany()
  await prisma.storeSetting.deleteMany()
}

export async function createCity(overrides?: Partial<{ name: string; slug: string; isActive: boolean }>) {
  return prisma.city.create({
    data: { name: 'São Paulo', slug: 'sao-paulo', isActive: true, ...overrides },
  })
}

export async function createCategory(overrides?: Partial<{ name: string; slug: string }>) {
  return prisma.category.create({
    data: { name: 'Geral', slug: 'geral', isActive: true, ...overrides },
  })
}

export async function createProduct(categoryId: string, overrides?: Record<string, unknown>) {
  return prisma.product.create({
    data: {
      name: 'Produto Teste',
      slug: `produto-${Date.now()}`,
      price: 29.9,
      categoryId,
      isActive: true,
      ...overrides,
    },
  })
}

export async function createUser(overrides?: Record<string, unknown>) {
  return prisma.user.create({
    data: {
      telegramId: BigInt(Math.floor(Math.random() * 1e12)),
      firstName: 'Test',
      ...overrides,
    },
  })
}

export { prisma }
```

- [ ] **Step 4: Configure vitest**

Add `vitest.config.ts` to `backend/`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    testTimeout: 15000,
  },
})
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/plugins/ backend/tests/ backend/vitest.config.ts
git commit -m "feat: add prisma plugin and test helpers"
```

---

## Task 4: Telegram Auth Library + Route

**Files:**
- Create: `backend/src/lib/telegram-auth.ts`
- Create: `backend/src/routes/auth.ts`
- Create: `backend/tests/auth.test.ts`

- [ ] **Step 1: Write failing test**

`backend/tests/auth.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createHmac } from 'crypto'
import { getTestApp } from './helpers/app.js'
import { cleanDb } from './helpers/fixtures.js'

function buildValidInitData(botToken: string, userId = 123456789) {
  const authDate = Math.floor(Date.now() / 1000)
  const dataCheckString = [
    `auth_date=${authDate}`,
    `first_name=Test`,
    `id=${userId}`,
    `username=testuser`,
  ]
    .sort()
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  const params = new URLSearchParams({
    auth_date: String(authDate),
    first_name: 'Test',
    id: String(userId),
    username: 'testuser',
    hash,
  })
  return params.toString()
}

describe('POST /auth/telegram', () => {
  const app = getTestApp()

  beforeAll(async () => { await app.ready() })
  afterAll(async () => { await app.close() })
  beforeEach(async () => { await cleanDb() })

  it('returns 400 when initData is missing', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/telegram', body: {} })
    expect(res.statusCode).toBe(400)
  })

  it('returns 401 when initData hash is invalid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/telegram',
      body: { initData: 'id=123&hash=fakehash&auth_date=99999' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 200 and creates user on valid initData', async () => {
    const botToken = process.env.BOT_TOKEN ?? 'test-token'
    const initData = buildValidInitData(botToken)
    const res = await app.inject({
      method: 'POST',
      url: '/auth/telegram',
      body: { initData },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.user.telegramId).toBe('123456789')
    expect(body.token).toBeTruthy()
  })

  it('returns existing user on second auth', async () => {
    const botToken = process.env.BOT_TOKEN ?? 'test-token'
    const initData = buildValidInitData(botToken, 999)
    await app.inject({ method: 'POST', url: '/auth/telegram', body: { initData } })
    const res = await app.inject({ method: 'POST', url: '/auth/telegram', body: { initData } })
    expect(res.statusCode).toBe(200)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd backend && npm test -- tests/auth.test.ts
```

Expected: FAIL — `auth route not found`

- [ ] **Step 3: Create src/lib/telegram-auth.ts**

```typescript
import { createHmac } from 'crypto'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export function validateInitData(initData: string, botToken: string): TelegramUser {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) throw new Error('Missing hash')

  params.delete('hash')
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (expectedHash !== hash) throw new Error('Invalid hash')

  const authDate = Number(params.get('auth_date'))
  const fiveMinutes = 5 * 60
  if (Math.floor(Date.now() / 1000) - authDate > fiveMinutes) {
    throw new Error('initData expired')
  }

  return {
    id: Number(params.get('id')),
    first_name: params.get('first_name') ?? '',
    last_name: params.get('last_name') ?? undefined,
    username: params.get('username') ?? undefined,
    language_code: params.get('language_code') ?? undefined,
  }
}
```

- [ ] **Step 4: Create src/routes/auth.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { validateInitData } from '../lib/telegram-auth.js'
import { SignJWT, generateSecret } from 'jose'

// Simple symmetric JWT using ADMIN_SECRET as key material
import { createHmac } from 'crypto'

function signUserToken(userId: string): string {
  const secret = process.env.ADMIN_SECRET ?? 'dev-secret'
  const payload = JSON.stringify({ userId, iat: Date.now() })
  const sig = createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(JSON.stringify({ payload, sig })).toString('base64url')
}

export function verifyUserToken(token: string): { userId: string } {
  const secret = process.env.ADMIN_SECRET ?? 'dev-secret'
  const { payload, sig } = JSON.parse(Buffer.from(token, 'base64url').toString())
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  if (expected !== sig) throw new Error('Invalid token')
  return JSON.parse(payload)
}

const authRoute: FastifyPluginAsync = async (app) => {
  app.post('/telegram', async (req, reply) => {
    const { initData } = req.body as { initData?: string }
    if (!initData) return reply.status(400).send({ error: 'initData required' })

    let telegramUser
    try {
      telegramUser = validateInitData(initData, process.env.BOT_TOKEN ?? 'test-token')
    } catch {
      return reply.status(401).send({ error: 'Invalid initData' })
    }

    const user = await app.prisma.user.upsert({
      where: { telegramId: BigInt(telegramUser.id) },
      update: {
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        languageCode: telegramUser.language_code,
      },
      create: {
        telegramId: BigInt(telegramUser.id),
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        languageCode: telegramUser.language_code,
      },
    })

    const token = signUserToken(user.id)
    return reply.send({
      token,
      user: { ...user, telegramId: user.telegramId.toString() },
    })
  })
}

export default authRoute
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && npm test -- tests/auth.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/src/lib/telegram-auth.ts backend/src/routes/auth.ts backend/tests/auth.test.ts
git commit -m "feat: add telegram initData validation and auth route"
```

---

## Task 5: User Auth Middleware (for protected routes)

**Files:**
- Create: `backend/src/lib/user-auth.ts`

- [ ] **Step 1: Create src/lib/user-auth.ts**

```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyUserToken } from '../routes/auth.js'

export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
  try {
    const { userId } = verifyUserToken(authHeader.slice(7))
    ;(req as any).userId = userId
  } catch {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/lib/user-auth.ts
git commit -m "feat: add user auth middleware"
```

---

## Task 6: Admin Auth Middleware

**Files:**
- Create: `backend/src/lib/admin-auth.ts`

- [ ] **Step 1: Write failing test (inline in admin.test.ts)**

Create `backend/tests/admin.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getTestApp } from './helpers/app.js'

describe('Admin auth guard', () => {
  const app = getTestApp()
  beforeAll(async () => { await app.ready() })
  afterAll(async () => { await app.close() })

  it('returns 401 without Authorization header on admin route', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/products' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 with wrong token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/products',
      headers: { authorization: 'Bearer wrong-token' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 200 with correct admin token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/products',
      headers: { authorization: `Bearer ${process.env.ADMIN_SECRET ?? 'test-admin'}` },
    })
    expect(res.statusCode).toBe(200)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd backend && npm test -- tests/admin.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/lib/admin-auth.ts**

```typescript
import { FastifyRequest, FastifyReply } from 'fastify'

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
  const token = authHeader.slice(7)
  const adminSecret = process.env.ADMIN_SECRET ?? 'test-admin'
  if (token !== adminSecret) {
    return reply.status(401).send({ error: 'Forbidden' })
  }
}
```

- [ ] **Step 4: Create src/routes/admin/products.ts (stub for test)**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminProductsRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async () => {
    return []
  })
}

export default adminProductsRoute
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && npm test -- tests/admin.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/src/lib/admin-auth.ts backend/src/routes/admin/products.ts backend/tests/admin.test.ts
git commit -m "feat: add admin auth middleware"
```

---

## Task 7: Cities API (public + admin)

**Files:**
- Create: `backend/src/routes/cities.ts`
- Create: `backend/src/routes/admin/cities.ts`
- Create: `backend/tests/cities.test.ts`

- [ ] **Step 1: Write failing tests**

`backend/tests/cities.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { getTestApp } from './helpers/app.js'
import { cleanDb, createCity } from './helpers/fixtures.js'

describe('Cities API', () => {
  const app = getTestApp()
  beforeAll(async () => { await app.ready() })
  afterAll(async () => { await app.close() })
  beforeEach(async () => { await cleanDb() })

  describe('GET /cities', () => {
    it('returns only active cities ordered by sortOrder', async () => {
      await createCity({ name: 'Rio de Janeiro', slug: 'rio', isActive: false })
      await createCity({ name: 'São Paulo', slug: 'sp', isActive: true })

      const res = await app.inject({ method: 'GET', url: '/cities' })
      expect(res.statusCode).toBe(200)
      const cities = res.json()
      expect(cities).toHaveLength(1)
      expect(cities[0].name).toBe('São Paulo')
    })
  })

  describe('Admin /admin/cities', () => {
    const adminHeaders = { authorization: `Bearer ${process.env.ADMIN_SECRET ?? 'test-admin'}` }

    it('POST creates a city', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/admin/cities',
        headers: adminHeaders,
        body: { name: 'Brasília', slug: 'bsb' },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().name).toBe('Brasília')
    })

    it('PATCH toggles isActive', async () => {
      const city = await createCity()
      const res = await app.inject({
        method: 'PATCH',
        url: `/admin/cities/${city.id}`,
        headers: adminHeaders,
        body: { isActive: false },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().isActive).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd backend && npm test -- tests/cities.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/routes/cities.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'

const citiesRoute: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    return app.prisma.city.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    })
  })
}

export default citiesRoute
```

- [ ] **Step 4: Create src/routes/admin/cities.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminCitiesRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async () => {
    return app.prisma.city.findMany({ orderBy: { sortOrder: 'asc' } })
  })

  app.post('/', async (req, reply) => {
    const { name, slug, sortOrder } = req.body as { name: string; slug: string; sortOrder?: number }
    const city = await app.prisma.city.create({ data: { name, slug, sortOrder: sortOrder ?? 0 } })
    return reply.status(201).send(city)
  })

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = req.body as Partial<{ name: string; isActive: boolean; sortOrder: number }>
    const city = await app.prisma.city.update({ where: { id }, data })
    return reply.send(city)
  })

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.city.delete({ where: { id } })
    return reply.status(204).send()
  })
}

export default adminCitiesRoute
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && npm test -- tests/cities.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/cities.ts backend/src/routes/admin/cities.ts backend/tests/cities.test.ts
git commit -m "feat: add cities API (public + admin)"
```

---

## Task 8: Categories API

**Files:**
- Create: `backend/src/routes/categories.ts`
- Create: `backend/tests/categories.test.ts`

- [ ] **Step 1: Write failing test**

`backend/tests/categories.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { getTestApp } from './helpers/app.js'
import { cleanDb, createCategory } from './helpers/fixtures.js'

describe('GET /categories', () => {
  const app = getTestApp()
  beforeAll(async () => { await app.ready() })
  afterAll(async () => { await app.close() })
  beforeEach(async () => { await cleanDb() })

  it('returns active categories ordered by sortOrder', async () => {
    await createCategory({ name: 'Bebidas', slug: 'bebidas' })
    await createCategory({ name: 'Inativo', slug: 'inativo' })
    await app.prisma.category.updateMany({ where: { slug: 'inativo' }, data: { isActive: false } })

    const res = await app.inject({ method: 'GET', url: '/categories' })
    expect(res.statusCode).toBe(200)
    const cats = res.json()
    expect(cats).toHaveLength(1)
    expect(cats[0].slug).toBe('bebidas')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd backend && npm test -- tests/categories.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/routes/categories.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'

const categoriesRoute: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    return app.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    })
  })
}

export default categoriesRoute
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npm test -- tests/categories.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/categories.ts backend/tests/categories.test.ts
git commit -m "feat: add categories API"
```

---

## Task 9: Products API (public + admin)

**Files:**
- Create: `backend/src/routes/products.ts`
- Modify: `backend/src/routes/admin/products.ts` (full CRUD)
- Create: `backend/tests/products.test.ts`

- [ ] **Step 1: Write failing tests**

`backend/tests/products.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { getTestApp } from './helpers/app.js'
import { cleanDb, createCategory, createProduct } from './helpers/fixtures.js'

describe('Products API', () => {
  const app = getTestApp()
  beforeAll(async () => { await app.ready() })
  afterAll(async () => { await app.close() })
  beforeEach(async () => { await cleanDb() })

  describe('GET /products', () => {
    it('returns only active products', async () => {
      const cat = await createCategory()
      await createProduct(cat.id, { name: 'Ativo', isActive: true })
      await createProduct(cat.id, { name: 'Inativo', isActive: false })
      const res = await app.inject({ method: 'GET', url: '/products' })
      expect(res.statusCode).toBe(200)
      const products = res.json()
      expect(products).toHaveLength(1)
      expect(products[0].name).toBe('Ativo')
    })

    it('filters by categoryId', async () => {
      const cat1 = await createCategory({ name: 'A', slug: 'a' })
      const cat2 = await createCategory({ name: 'B', slug: 'b' })
      await createProduct(cat1.id)
      await createProduct(cat2.id)
      const res = await app.inject({ method: 'GET', url: `/products?categoryId=${cat1.id}` })
      expect(res.statusCode).toBe(200)
      expect(res.json()).toHaveLength(1)
    })
  })

  describe('GET /products/:id', () => {
    it('returns product with media', async () => {
      const cat = await createCategory()
      const p = await createProduct(cat.id)
      const res = await app.inject({ method: 'GET', url: `/products/${p.id}` })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.id).toBe(p.id)
      expect(Array.isArray(body.media)).toBe(true)
    })

    it('returns 404 for inactive product', async () => {
      const cat = await createCategory()
      const p = await createProduct(cat.id, { isActive: false })
      const res = await app.inject({ method: 'GET', url: `/products/${p.id}` })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('Admin /admin/products', () => {
    const adminHeaders = { authorization: `Bearer ${process.env.ADMIN_SECRET ?? 'test-admin'}` }

    it('POST creates product', async () => {
      const cat = await createCategory()
      const res = await app.inject({
        method: 'POST',
        url: '/admin/products',
        headers: adminHeaders,
        body: { name: 'Novo', slug: 'novo', price: 19.9, categoryId: cat.id },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().name).toBe('Novo')
    })

    it('PATCH updates product', async () => {
      const cat = await createCategory()
      const p = await createProduct(cat.id)
      const res = await app.inject({
        method: 'PATCH',
        url: `/admin/products/${p.id}`,
        headers: adminHeaders,
        body: { price: 99.9 },
      })
      expect(res.statusCode).toBe(200)
      expect(Number(res.json().price)).toBe(99.9)
    })
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd backend && npm test -- tests/products.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/routes/products.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'

const productsRoute: FastifyPluginAsync = async (app) => {
  app.get('/', async (req) => {
    const { categoryId, search } = req.query as { categoryId?: string; search?: string }
    return app.prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: { media: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: true },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const product = await app.prisma.product.findFirst({
      where: { id, isActive: true },
      include: { media: { orderBy: { sortOrder: 'asc' } }, category: true },
    })
    if (!product) return reply.status(404).send({ error: 'Product not found' })
    return product
  })
}

export default productsRoute
```

- [ ] **Step 4: Replace src/routes/admin/products.ts with full CRUD**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminProductsRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async () => {
    return app.prisma.product.findMany({
      include: { category: true, media: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.post('/', async (req, reply) => {
    const body = req.body as {
      name: string
      slug: string
      description?: string
      price: number
      categoryId: string
      isActive?: boolean
      media?: Array<{ type: string; url: string; sortOrder?: number }>
    }
    const product = await app.prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        price: body.price,
        categoryId: body.categoryId,
        isActive: body.isActive ?? true,
        media: body.media
          ? { create: body.media.map((m, i) => ({ ...m, sortOrder: m.sortOrder ?? i })) }
          : undefined,
      },
      include: { media: true },
    })
    return reply.status(201).send(product)
  })

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = req.body as Partial<{
      name: string; slug: string; description: string; price: number;
      categoryId: string; isActive: boolean
    }>
    const product = await app.prisma.product.update({ where: { id }, data })
    return reply.send(product)
  })

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.product.update({ where: { id }, data: { isActive: false } })
    return reply.status(204).send()
  })

  app.post('/:id/media', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { type, url, sortOrder } = req.body as { type: string; url: string; sortOrder?: number }
    const media = await app.prisma.productMedia.create({
      data: { productId: id, type, url, sortOrder: sortOrder ?? 0 },
    })
    return reply.status(201).send(media)
  })

  app.delete('/:id/media/:mediaId', async (req, reply) => {
    const { mediaId } = req.params as { id: string; mediaId: string }
    await app.prisma.productMedia.delete({ where: { id: mediaId } })
    return reply.status(204).send()
  })
}

export default adminProductsRoute
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && npm test -- tests/products.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/products.ts backend/src/routes/admin/products.ts backend/tests/products.test.ts
git commit -m "feat: add products API (public + admin CRUD)"
```

---

## Task 10: Orders API

**Files:**
- Create: `backend/src/routes/orders.ts`
- Create: `backend/src/routes/admin/orders.ts`
- Create: `backend/tests/orders.test.ts`

- [ ] **Step 1: Write failing tests**

`backend/tests/orders.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { getTestApp } from './helpers/app.js'
import { cleanDb, createCity, createCategory, createProduct, createUser } from './helpers/fixtures.js'

async function getAuthToken(app: ReturnType<typeof getTestApp>, telegramId = 77777) {
  // Build a fake but structurally valid token for tests by calling auth route
  // In test mode (BOT_TOKEN=test-token) the token is accepted if signed correctly
  const { createHmac } = await import('crypto')
  const botToken = process.env.BOT_TOKEN ?? 'test-token'
  const authDate = Math.floor(Date.now() / 1000)
  const dataCheckString = [`auth_date=${authDate}`, `first_name=Test`, `id=${telegramId}`].sort().join('\n')
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  const params = new URLSearchParams({ auth_date: String(authDate), first_name: 'Test', id: String(telegramId), hash })
  const res = await app.inject({ method: 'POST', url: '/auth/telegram', body: { initData: params.toString() } })
  return res.json().token as string
}

describe('Orders API', () => {
  const app = getTestApp()
  beforeAll(async () => { await app.ready() })
  afterAll(async () => { await app.close() })
  beforeEach(async () => { await cleanDb() })

  describe('POST /orders/checkout', () => {
    it('creates order with correct snapshots and total', async () => {
      const city = await createCity()
      const cat = await createCategory()
      const product = await createProduct(cat.id, { price: 10.0 })
      const token = await getAuthToken(app)

      const res = await app.inject({
        method: 'POST',
        url: '/orders/checkout',
        headers: { authorization: `Bearer ${token}` },
        body: {
          cityId: city.id,
          items: [{ productId: product.id, quantity: 2 }],
        },
      })
      expect(res.statusCode).toBe(201)
      const order = res.json()
      expect(order.status).toBe('submitted')
      expect(Number(order.totalAmount)).toBe(20)
      expect(order.items[0].productNameSnapshot).toBe('Produto Teste')
      expect(Number(order.items[0].unitPriceSnapshot)).toBe(10)
      expect(order.items[0].quantity).toBe(2)
    })

    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'POST', url: '/orders/checkout', body: {} })
      expect(res.statusCode).toBe(401)
    })

    it('returns 400 when product is inactive', async () => {
      const city = await createCity()
      const cat = await createCategory()
      const product = await createProduct(cat.id, { isActive: false })
      const token = await getAuthToken(app, 88888)

      const res = await app.inject({
        method: 'POST',
        url: '/orders/checkout',
        headers: { authorization: `Bearer ${token}` },
        body: { cityId: city.id, items: [{ productId: product.id, quantity: 1 }] },
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('GET /orders/me', () => {
    it('returns only current user orders', async () => {
      const city = await createCity()
      const cat = await createCategory()
      const product = await createProduct(cat.id)
      const token = await getAuthToken(app, 11111)

      await app.inject({
        method: 'POST',
        url: '/orders/checkout',
        headers: { authorization: `Bearer ${token}` },
        body: { cityId: city.id, items: [{ productId: product.id, quantity: 1 }] },
      })

      const res = await app.inject({
        method: 'GET',
        url: '/orders/me',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      const orders = res.json()
      expect(orders).toHaveLength(1)
    })
  })

  describe('Admin /admin/orders', () => {
    const adminHeaders = { authorization: `Bearer ${process.env.ADMIN_SECRET ?? 'test-admin'}` }

    it('PATCH updates order status', async () => {
      const city = await createCity()
      const cat = await createCategory()
      const product = await createProduct(cat.id)
      const token = await getAuthToken(app, 22222)

      const createRes = await app.inject({
        method: 'POST',
        url: '/orders/checkout',
        headers: { authorization: `Bearer ${token}` },
        body: { cityId: city.id, items: [{ productId: product.id, quantity: 1 }] },
      })
      const orderId = createRes.json().id

      const patchRes = await app.inject({
        method: 'PATCH',
        url: `/admin/orders/${orderId}/status`,
        headers: adminHeaders,
        body: { status: 'confirmed' },
      })
      expect(patchRes.statusCode).toBe(200)
      expect(patchRes.json().status).toBe('confirmed')
    })
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd backend && npm test -- tests/orders.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/routes/orders.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { requireUser } from '../lib/user-auth.js'

const VALID_STATUSES = ['submitted', 'in_review', 'confirmed', 'cancelled']

const ordersRoute: FastifyPluginAsync = async (app) => {
  app.post('/checkout', { preHandler: requireUser }, async (req, reply) => {
    const userId = (req as any).userId as string
    const { cityId, items, notes } = req.body as {
      cityId: string
      items: Array<{ productId: string; quantity: number }>
      notes?: string
    }

    if (!items?.length) return reply.status(400).send({ error: 'items required' })

    const productIds = items.map((i) => i.productId)
    const products = await app.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    })

    if (products.length !== productIds.length) {
      return reply.status(400).send({ error: 'One or more products are unavailable' })
    }

    const productMap = new Map(products.map((p) => [p.id, p]))
    let totalAmount = 0
    const orderItems = items.map((item) => {
      const product = productMap.get(item.productId)!
      const unitPrice = Number(product.price)
      const lineTotal = unitPrice * item.quantity
      totalAmount += lineTotal
      return {
        productId: item.productId,
        productNameSnapshot: product.name,
        unitPriceSnapshot: unitPrice,
        quantity: item.quantity,
        lineTotal,
      }
    })

    const order = await app.prisma.order.create({
      data: {
        userId,
        cityId,
        status: 'submitted',
        totalAmount,
        notes,
        items: { create: orderItems },
      },
      include: { items: true, city: true },
    })

    return reply.status(201).send(order)
  })

  app.get('/me', { preHandler: requireUser }, async (req) => {
    const userId = (req as any).userId as string
    return app.prisma.order.findMany({
      where: { userId },
      include: { items: true, city: true },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.get('/:id', { preHandler: requireUser }, async (req, reply) => {
    const userId = (req as any).userId as string
    const { id } = req.params as { id: string }
    const order = await app.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, city: true },
    })
    if (!order) return reply.status(404).send({ error: 'Order not found' })
    return order
  })
}

export default ordersRoute
```

- [ ] **Step 4: Create src/routes/admin/orders.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const VALID_STATUSES = ['submitted', 'in_review', 'confirmed', 'cancelled']

const adminOrdersRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async (req) => {
    const { status, cityId } = req.query as { status?: string; cityId?: string }
    return app.prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(cityId ? { cityId } : {}),
      },
      include: { items: true, city: true, user: true },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const order = await app.prisma.order.findUnique({
      where: { id },
      include: { items: true, city: true, user: true },
    })
    if (!order) return reply.status(404).send({ error: 'Not found' })
    return order
  })

  app.patch('/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { status } = req.body as { status: string }
    if (!VALID_STATUSES.includes(status)) {
      return reply.status(400).send({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` })
    }
    const order = await app.prisma.order.update({ where: { id }, data: { status } })
    return reply.send(order)
  })
}

export default adminOrdersRoute
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && npm test -- tests/orders.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/orders.ts backend/src/routes/admin/orders.ts backend/tests/orders.test.ts
git commit -m "feat: add orders API with snapshot pricing"
```

---

## Task 11: Admin Settings Route

**Files:**
- Create: `backend/src/routes/admin/settings.ts`

- [ ] **Step 1: Create src/routes/admin/settings.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminSettingsRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async () => {
    const settings = await app.prisma.storeSetting.findFirst()
    if (!settings) {
      return app.prisma.storeSetting.create({ data: { storeName: 'Minha Loja' } })
    }
    return settings
  })

  app.patch('/', async (req, reply) => {
    const data = req.body as Partial<{
      storeName: string
      logoUrl: string
      supportTelegramUrl: string
      defaultLanguage: string
      welcomeText: string
    }>
    let settings = await app.prisma.storeSetting.findFirst()
    if (!settings) {
      settings = await app.prisma.storeSetting.create({ data: { storeName: 'Minha Loja', ...data } })
    } else {
      settings = await app.prisma.storeSetting.update({ where: { id: settings.id }, data })
    }
    return reply.send(settings)
  })
}

export default adminSettingsRoute
```

- [ ] **Step 2: Verify admin settings is accessible**

```bash
cd backend && npm test -- tests/admin.test.ts
```

Expected: PASS (existing tests still pass)

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/admin/settings.ts
git commit -m "feat: add admin settings route"
```

---

## Task 12: Full Test Suite Run + Seed Script

**Files:**
- Create: `backend/prisma/seed.ts`

- [ ] **Step 1: Run all tests**

```bash
cd backend && npm test
```

Expected: All tests PASS

- [ ] **Step 2: Create prisma/seed.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const sp = await prisma.city.upsert({
    where: { slug: 'sao-paulo' },
    update: {},
    create: { name: 'São Paulo', slug: 'sao-paulo', sortOrder: 1 },
  })

  const rj = await prisma.city.upsert({
    where: { slug: 'rio-de-janeiro' },
    update: {},
    create: { name: 'Rio de Janeiro', slug: 'rio-de-janeiro', sortOrder: 2 },
  })

  const bebidas = await prisma.category.upsert({
    where: { slug: 'bebidas' },
    update: {},
    create: { name: 'Bebidas', slug: 'bebidas', sortOrder: 1 },
  })

  const lanches = await prisma.category.upsert({
    where: { slug: 'lanches' },
    update: {},
    create: { name: 'Lanches', slug: 'lanches', sortOrder: 2 },
  })

  await prisma.product.upsert({
    where: { slug: 'agua-mineral' },
    update: {},
    create: {
      name: 'Água Mineral 500ml',
      slug: 'agua-mineral',
      description: 'Água mineral natural gelada',
      price: 3.5,
      categoryId: bebidas.id,
    },
  })

  await prisma.product.upsert({
    where: { slug: 'x-burguer' },
    update: {},
    create: {
      name: 'X-Burguer',
      slug: 'x-burguer',
      description: 'Hambúrguer artesanal com queijo',
      price: 24.9,
      categoryId: lanches.id,
    },
  })

  await prisma.storeSetting.deleteMany()
  await prisma.storeSetting.create({
    data: {
      storeName: 'Lojinha',
      supportTelegramUrl: 'https://t.me/suporte',
      defaultLanguage: 'pt',
      welcomeText: 'Bem-vindo à nossa loja! Selecione sua cidade para começar.',
    },
  })

  console.log('Seed completed.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

- [ ] **Step 3: Run seed**

```bash
cd backend && npm run db:seed
```

Expected: `Seed completed.`

- [ ] **Step 4: Final commit**

```bash
git add backend/prisma/seed.ts
git commit -m "feat: add database seed with initial cities, categories, products and store settings"
```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| POST /auth/telegram | Task 4 |
| GET /cities | Task 7 |
| GET /categories | Task 8 |
| GET /products, GET /products/:id | Task 9 |
| POST /orders/checkout | Task 10 |
| GET /orders/me, GET /orders/:id | Task 10 |
| Admin: products CRUD | Task 9 |
| Admin: orders list + status update | Task 10 |
| Admin: cities CRUD | Task 7 |
| Admin: settings GET/PATCH | Task 11 |
| initData HMAC validation | Task 4 |
| Snapshot de produto no pedido | Task 10 |
| Somente produtos ativos no catálogo | Task 9 |
| Somente cidades ativas no bot/sistema | Task 7 |
| User upsert no login | Task 4 |
| Status de pedido: submitted como default | Task 10 |
| Estrutura preparada para pagamento futuro | Schema (Task 2) — Order.status field is string, extensible |

### No Placeholders — Clean ✓

### Type Consistency Check

- `requireUser` injects `(req as any).userId: string` — used correctly in orders.ts ✓
- `requireAdmin` used as `preHandler` hook — consistent across all admin routes ✓
- `validateInitData` returns `TelegramUser` — consumed correctly in auth.ts ✓
- `verifyUserToken` exported from auth.ts, imported in user-auth.ts ✓
- `cleanDb()` deletes in FK-safe order (orderItems → orders → ... → cities) ✓
