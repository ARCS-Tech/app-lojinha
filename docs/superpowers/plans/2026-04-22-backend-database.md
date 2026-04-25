# Backend + Database — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full REST API backend with PostgreSQL database, Telegram auth, all public endpoints, and protected admin endpoints — including stock control, admin Telegram notification on order, and public store settings.

**Architecture:** Node.js + Fastify server with Prisma ORM on PostgreSQL. Telegram Mini App users authenticate via HMAC-validated initData. Admins authenticate via a static secret token. On order checkout, a Prisma transaction validates and decrements stock, then the backend sends a Telegram message to the admin.

**Tech Stack:** Node.js 20, TypeScript, Fastify 4, Prisma 5, PostgreSQL 15, Vitest

---

## File Structure

```
backend/
├── src/
│   ├── index.ts
│   ├── lib/
│   │   ├── telegram-auth.ts
│   │   ├── user-auth.ts
│   │   ├── admin-auth.ts
│   │   └── notify.ts              # sendAdminNotification helper
│   ├── plugins/
│   │   └── prisma.ts
│   └── routes/
│       ├── auth.ts
│       ├── cities.ts
│       ├── categories.ts
│       ├── products.ts
│       ├── orders.ts
│       ├── settings.ts            # public GET /settings
│       └── admin/
│           ├── products.ts
│           ├── orders.ts
│           ├── cities.ts
│           ├── categories.ts      # NEW
│           └── settings.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   ├── helpers/
│   │   ├── app.ts
│   │   └── fixtures.ts
│   ├── auth.test.ts
│   ├── cities.test.ts
│   ├── categories.test.ts
│   ├── products.test.ts
│   ├── orders.test.ts
│   └── admin.test.ts
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Task 1: Project Bootstrap

- [ ] **Step 1: Create backend directory and install dependencies**

```bash
mkdir -p /Users/hover/Desktop/Programas/app-lojinha/backend
cd /Users/hover/Desktop/Programas/app-lojinha/backend
npm init -y
npm install fastify @fastify/cors @prisma/client fastify-plugin
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

Copy to `.env` and fill in real values.

- [ ] **Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 15000,
  },
})
```

- [ ] **Step 6: Create src/index.ts**

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
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

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(cors, { origin: true })
  app.register(prismaPlugin)

  app.register(authRoute, { prefix: '/auth' })
  app.register(citiesRoute, { prefix: '/cities' })
  app.register(categoriesRoute, { prefix: '/categories' })
  app.register(productsRoute, { prefix: '/products' })
  app.register(ordersRoute, { prefix: '/orders' })
  app.register(settingsRoute, { prefix: '/settings' })

  app.register(adminProductsRoute, { prefix: '/admin/products' })
  app.register(adminOrdersRoute, { prefix: '/admin/orders' })
  app.register(adminCitiesRoute, { prefix: '/admin/cities' })
  app.register(adminCategoriesRoute, { prefix: '/admin/categories' })
  app.register(adminSettingsRoute, { prefix: '/admin/settings' })

  return app
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const app = buildApp()
  await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
}
```

- [ ] **Step 7: Commit**

```bash
git add backend/
git commit -m "feat: bootstrap backend project"
```

---

## Task 2: Prisma Schema + Migration

- [ ] **Step 1: Initialize Prisma**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/backend
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
  stock       Int            @default(0)
  categoryId  String
  category    Category       @relation(fields: [categoryId], references: [id])
  isActive    Boolean        @default(true)
  media       ProductMedia[]
  orderItems  OrderItem[]
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

model StoreSetting {
  id                 String   @id @default(cuid())
  storeName          String   @default("Minha Loja")
  logoUrl            String?
  supportTelegramUrl String?
  adminTelegramId    String?
  defaultLanguage    String   @default("pt")
  welcomeText        String?
  updatedAt          DateTime @updatedAt

  @@map("store_settings")
}
```

- [ ] **Step 3: Run migration**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/backend
npx prisma migrate dev --name init
```

Expected: `✓ Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/
git commit -m "feat: add prisma schema with all models including stock and adminTelegramId"
```

---

## Task 3: Prisma Plugin + Test Helpers

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
      stock: 100,
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

- [ ] **Step 4: Commit**

```bash
git add backend/src/plugins/ backend/tests/ backend/vitest.config.ts
git commit -m "feat: add prisma plugin and test helpers"
```

---

## Task 4: Telegram Auth Library + Route

- [ ] **Step 1: Create src/lib/telegram-auth.ts**

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
  if (Math.floor(Date.now() / 1000) - authDate > 300) throw new Error('initData expired')

  return {
    id: Number(params.get('id')),
    first_name: params.get('first_name') ?? '',
    last_name: params.get('last_name') ?? undefined,
    username: params.get('username') ?? undefined,
    language_code: params.get('language_code') ?? undefined,
  }
}
```

- [ ] **Step 2: Create src/routes/auth.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { validateInitData } from '../lib/telegram-auth.js'
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
    return reply.send({ token, user: { ...user, telegramId: user.telegramId.toString() } })
  })
}

export default authRoute
```

- [ ] **Step 3: Write tests/auth.test.ts**

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createHmac } from 'crypto'
import { getTestApp } from './helpers/app.js'
import { cleanDb } from './helpers/fixtures.js'

function buildValidInitData(botToken: string, userId = 123456789) {
  const authDate = Math.floor(Date.now() / 1000)
  const dataCheckString = [`auth_date=${authDate}`, `first_name=Test`, `id=${userId}`].sort().join('\n')
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  return new URLSearchParams({ auth_date: String(authDate), first_name: 'Test', id: String(userId), hash }).toString()
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

  it('returns 401 when hash is invalid', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/telegram',
      body: { initData: 'id=123&hash=fakehash&auth_date=99999' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 200 and creates user on valid initData', async () => {
    const initData = buildValidInitData(process.env.BOT_TOKEN ?? 'test-token')
    const res = await app.inject({ method: 'POST', url: '/auth/telegram', body: { initData } })
    expect(res.statusCode).toBe(200)
    expect(res.json().token).toBeTruthy()
    expect(res.json().user.telegramId).toBe('123456789')
  })

  it('returns existing user on second auth', async () => {
    const initData = buildValidInitData(process.env.BOT_TOKEN ?? 'test-token', 999)
    await app.inject({ method: 'POST', url: '/auth/telegram', body: { initData } })
    const res = await app.inject({ method: 'POST', url: '/auth/telegram', body: { initData } })
    expect(res.statusCode).toBe(200)
  })
})
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/backend && npm test -- tests/auth.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/telegram-auth.ts backend/src/routes/auth.ts backend/tests/auth.test.ts
git commit -m "feat: add telegram auth route"
```

---

## Task 5: Auth Middlewares

- [ ] **Step 1: Create src/lib/user-auth.ts**

```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyUserToken } from '../routes/auth.js'

export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Unauthorized' })
  try {
    const { userId } = verifyUserToken(authHeader.slice(7))
    ;(req as any).userId = userId
  } catch {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}
```

- [ ] **Step 2: Create src/lib/admin-auth.ts**

```typescript
import { FastifyRequest, FastifyReply } from 'fastify'

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Unauthorized' })
  const token = authHeader.slice(7)
  if (token !== (process.env.ADMIN_SECRET ?? 'test-admin')) {
    return reply.status(401).send({ error: 'Forbidden' })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/lib/user-auth.ts backend/src/lib/admin-auth.ts
git commit -m "feat: add user and admin auth middlewares"
```

---

## Task 6: Cities + Categories API

- [ ] **Step 1: Create src/routes/cities.ts**

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

- [ ] **Step 2: Create src/routes/categories.ts**

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

- [ ] **Step 3: Create src/routes/admin/cities.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminCitiesRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async () => app.prisma.city.findMany({ orderBy: { sortOrder: 'asc' } }))

  app.post('/', async (req, reply) => {
    const { name, slug, sortOrder } = req.body as { name: string; slug: string; sortOrder?: number }
    return reply.status(201).send(await app.prisma.city.create({ data: { name, slug, sortOrder: sortOrder ?? 0 } }))
  })

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = req.body as Partial<{ name: string; isActive: boolean; sortOrder: number }>
    return reply.send(await app.prisma.city.update({ where: { id }, data }))
  })

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.city.delete({ where: { id } })
    return reply.status(204).send()
  })
}

export default adminCitiesRoute
```

- [ ] **Step 4: Write tests/cities.test.ts**

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { getTestApp } from './helpers/app.js'
import { cleanDb, createCity } from './helpers/fixtures.js'

describe('Cities API', () => {
  const app = getTestApp()
  beforeAll(async () => { await app.ready() })
  afterAll(async () => { await app.close() })
  beforeEach(async () => { await cleanDb() })

  it('GET /cities returns only active cities', async () => {
    await createCity({ name: 'Rio', slug: 'rio', isActive: false })
    await createCity({ name: 'SP', slug: 'sp', isActive: true })
    const res = await app.inject({ method: 'GET', url: '/cities' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
    expect(res.json()[0].name).toBe('SP')
  })

  it('POST /admin/cities creates a city', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/cities',
      headers: { authorization: `Bearer ${process.env.ADMIN_SECRET ?? 'test-admin'}` },
      body: { name: 'Brasília', slug: 'bsb' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().name).toBe('Brasília')
  })
})
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/backend && npm test -- tests/cities.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/cities.ts backend/src/routes/categories.ts backend/src/routes/admin/cities.ts backend/tests/cities.test.ts
git commit -m "feat: add cities and categories API"
```

---

## Task 7: Products API

- [ ] **Step 1: Create src/routes/products.ts**

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
      include: {
        media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const product = await app.prisma.product.findFirst({
      where: { id, isActive: true },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true } },
      },
    })
    if (!product) return reply.status(404).send({ error: 'Product not found' })
    return product
  })
}

export default productsRoute
```

- [ ] **Step 2: Create src/routes/admin/products.ts**

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

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const p = await app.prisma.product.findUnique({
      where: { id },
      include: { category: true, media: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!p) return reply.status(404).send({ error: 'Not found' })
    return p
  })

  app.post('/', async (req, reply) => {
    const body = req.body as {
      name: string; slug: string; description?: string; price: number
      categoryId: string; isActive?: boolean; stock?: number
      media?: Array<{ type: string; url: string; sortOrder?: number }>
    }
    const product = await app.prisma.product.create({
      data: {
        name: body.name, slug: body.slug, description: body.description,
        price: body.price, categoryId: body.categoryId,
        isActive: body.isActive ?? true, stock: body.stock ?? 0,
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
      name: string; slug: string; description: string; price: number
      categoryId: string; isActive: boolean; stock: number
    }>
    return reply.send(await app.prisma.product.update({ where: { id }, data }))
  })

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.product.update({ where: { id }, data: { isActive: false } })
    return reply.status(204).send()
  })

  app.post('/:id/media', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { type, url, sortOrder } = req.body as { type: string; url: string; sortOrder?: number }
    return reply.status(201).send(
      await app.prisma.productMedia.create({ data: { productId: id, type, url, sortOrder: sortOrder ?? 0 } })
    )
  })

  app.delete('/:id/media/:mediaId', async (req, reply) => {
    const { mediaId } = req.params as { id: string; mediaId: string }
    await app.prisma.productMedia.delete({ where: { id: mediaId } })
    return reply.status(204).send()
  })
}

export default adminProductsRoute
```

- [ ] **Step 3: Write tests/products.test.ts**

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { getTestApp } from './helpers/app.js'
import { cleanDb, createCategory, createProduct } from './helpers/fixtures.js'

describe('Products API', () => {
  const app = getTestApp()
  const adminHeaders = { authorization: `Bearer ${process.env.ADMIN_SECRET ?? 'test-admin'}` }
  beforeAll(async () => { await app.ready() })
  afterAll(async () => { await app.close() })
  beforeEach(async () => { await cleanDb() })

  it('GET /products returns active products with stock', async () => {
    const cat = await createCategory()
    await createProduct(cat.id, { isActive: true })
    await createProduct(cat.id, { isActive: false, slug: `inactive-${Date.now()}` })
    const res = await app.inject({ method: 'GET', url: '/products' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
    expect(res.json()[0].stock).toBeDefined()
  })

  it('GET /products/:id returns 404 for inactive product', async () => {
    const cat = await createCategory()
    const p = await createProduct(cat.id, { isActive: false })
    const res = await app.inject({ method: 'GET', url: `/products/${p.id}` })
    expect(res.statusCode).toBe(404)
  })

  it('POST /admin/products creates product with stock', async () => {
    const cat = await createCategory()
    const res = await app.inject({
      method: 'POST', url: '/admin/products', headers: adminHeaders,
      body: { name: 'Novo', slug: 'novo', price: 19.9, categoryId: cat.id, stock: 50 },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().stock).toBe(50)
  })

  it('PATCH /admin/products/:id updates stock', async () => {
    const cat = await createCategory()
    const p = await createProduct(cat.id)
    const res = await app.inject({
      method: 'PATCH', url: `/admin/products/${p.id}`, headers: adminHeaders,
      body: { stock: 25 },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().stock).toBe(25)
  })
})
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/backend && npm test -- tests/products.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/products.ts backend/src/routes/admin/products.ts backend/tests/products.test.ts
git commit -m "feat: add products API with stock field"
```

---

## Task 8: Admin Notification Helper

- [ ] **Step 1: Create src/lib/notify.ts**

```typescript
export async function sendAdminNotification(
  order: {
    id: string
    totalAmount: unknown
    items: Array<{ productNameSnapshot: string; quantity: number; lineTotal: unknown }>
    city: { name: string }
    user: { firstName: string; username?: string | null; telegramId: bigint }
  },
  adminTelegramId: string,
  botToken: string
): Promise<void> {
  const itemsList = order.items
    .map((i) => `• ${i.productNameSnapshot} × ${i.quantity} — R$ ${Number(i.lineTotal).toFixed(2)}`)
    .join('\n')

  const username = order.user.username ? ` @${order.user.username}` : ''
  const text = [
    `🛒 Novo pedido #${order.id.slice(-6).toUpperCase()}`,
    '',
    `👤 Cliente: ${order.user.firstName}${username}`,
    `🏙️ Cidade: ${order.city.name}`,
    '',
    `📦 Itens:`,
    itemsList,
    '',
    `💰 Total: R$ ${Number(order.totalAmount).toFixed(2)}`,
    '',
    `💬 Falar com cliente: tg://user?id=${order.user.telegramId}`,
  ].join('\n')

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: adminTelegramId, text }),
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/lib/notify.ts
git commit -m "feat: add admin Telegram notification helper"
```

---

## Task 9: Orders API (with stock + notification)

- [ ] **Step 1: Write tests/orders.test.ts**

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createHmac } from 'crypto'
import { getTestApp } from './helpers/app.js'
import { cleanDb, createCity, createCategory, createProduct } from './helpers/fixtures.js'

async function getAuthToken(app: ReturnType<typeof getTestApp>, telegramId = 77777) {
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

  it('POST /orders/checkout creates order and decrements stock', async () => {
    const city = await createCity()
    const cat = await createCategory()
    const product = await createProduct(cat.id, { price: 10.0, stock: 10 })
    const token = await getAuthToken(app)

    const res = await app.inject({
      method: 'POST', url: '/orders/checkout',
      headers: { authorization: `Bearer ${token}` },
      body: { cityId: city.id, items: [{ productId: product.id, quantity: 2 }] },
    })
    expect(res.statusCode).toBe(201)
    const order = res.json()
    expect(order.status).toBe('submitted')
    expect(Number(order.totalAmount)).toBe(20)
    expect(order.items[0].quantity).toBe(2)

    const { prisma } = await import('./helpers/fixtures.js')
    const updated = await prisma.product.findUnique({ where: { id: product.id } })
    expect(updated!.stock).toBe(8)
  })

  it('returns 400 when stock is insufficient', async () => {
    const city = await createCity()
    const cat = await createCategory()
    const product = await createProduct(cat.id, { stock: 1 })
    const token = await getAuthToken(app, 88888)

    const res = await app.inject({
      method: 'POST', url: '/orders/checkout',
      headers: { authorization: `Bearer ${token}` },
      body: { cityId: city.id, items: [{ productId: product.id, quantity: 2 }] },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('Estoque insuficiente')
  })

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'POST', url: '/orders/checkout', body: {} })
    expect(res.statusCode).toBe(401)
  })

  it('GET /orders/me returns only current user orders', async () => {
    const city = await createCity()
    const cat = await createCategory()
    const product = await createProduct(cat.id, { stock: 10 })
    const token = await getAuthToken(app, 11111)

    await app.inject({
      method: 'POST', url: '/orders/checkout',
      headers: { authorization: `Bearer ${token}` },
      body: { cityId: city.id, items: [{ productId: product.id, quantity: 1 }] },
    })

    const res = await app.inject({ method: 'GET', url: '/orders/me', headers: { authorization: `Bearer ${token}` } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/backend && npm test -- tests/orders.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create src/routes/orders.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { requireUser } from '../lib/user-auth.js'
import { sendAdminNotification } from '../lib/notify.js'

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
    let order: any

    try {
      order = await app.prisma.$transaction(async (tx) => {
        const products = await tx.product.findMany({ where: { id: { in: productIds }, isActive: true } })

        if (products.length !== productIds.length) {
          const err = new Error('One or more products are unavailable') as any
          err.statusCode = 400
          throw err
        }

        const productMap = new Map(products.map((p) => [p.id, p]))

        for (const item of items) {
          const product = productMap.get(item.productId)!
          if (product.stock < item.quantity) {
            const err = new Error(`Estoque insuficiente: ${product.name}`) as any
            err.statusCode = 400
            throw err
          }
        }

        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }

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

        return tx.order.create({
          data: { userId, cityId, status: 'submitted', totalAmount, notes, items: { create: orderItems } },
          include: { items: true, city: true, user: true },
        })
      })
    } catch (err: any) {
      if (err.statusCode === 400) return reply.status(400).send({ error: err.message })
      throw err
    }

    const settings = await app.prisma.storeSetting.findFirst()
    if (settings?.adminTelegramId && process.env.BOT_TOKEN) {
      sendAdminNotification(order, settings.adminTelegramId, process.env.BOT_TOKEN).catch(() => {})
    }

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
      where: { ...(status ? { status } : {}), ...(cityId ? { cityId } : {}) },
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
    return reply.send(await app.prisma.order.update({ where: { id }, data: { status } }))
  })
}

export default adminOrdersRoute
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/backend && npm test -- tests/orders.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/orders.ts backend/src/routes/admin/orders.ts backend/tests/orders.test.ts
git commit -m "feat: add orders API with stock validation and admin notification"
```

---

## Task 10: Public Settings + Admin Settings + Admin Categories

- [ ] **Step 1: Create src/routes/settings.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'

const settingsRoute: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    const s = await app.prisma.storeSetting.findFirst({
      select: { storeName: true, logoUrl: true, supportTelegramUrl: true, defaultLanguage: true },
    })
    return s ?? { storeName: 'Loja', logoUrl: null, supportTelegramUrl: null, defaultLanguage: 'pt' }
  })
}

export default settingsRoute
```

- [ ] **Step 2: Create src/routes/admin/settings.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminSettingsRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async () => {
    const s = await app.prisma.storeSetting.findFirst()
    if (!s) return app.prisma.storeSetting.create({ data: { storeName: 'Minha Loja' } })
    return s
  })

  app.patch('/', async (req, reply) => {
    const data = req.body as Partial<{
      storeName: string; logoUrl: string; supportTelegramUrl: string
      adminTelegramId: string; defaultLanguage: string; welcomeText: string
    }>
    let s = await app.prisma.storeSetting.findFirst()
    if (!s) {
      s = await app.prisma.storeSetting.create({ data: { storeName: 'Minha Loja', ...data } })
    } else {
      s = await app.prisma.storeSetting.update({ where: { id: s.id }, data })
    }
    return reply.send(s)
  })
}

export default adminSettingsRoute
```

- [ ] **Step 3: Create src/routes/admin/categories.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminCategoriesRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async () => app.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }))

  app.post('/', async (req, reply) => {
    const { name, slug, sortOrder } = req.body as { name: string; slug: string; sortOrder?: number }
    return reply.status(201).send(
      await app.prisma.category.create({ data: { name, slug, sortOrder: sortOrder ?? 0 } })
    )
  })

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = req.body as Partial<{ name: string; slug: string; isActive: boolean; sortOrder: number }>
    return reply.send(await app.prisma.category.update({ where: { id }, data }))
  })

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.category.delete({ where: { id } })
    return reply.status(204).send()
  })
}

export default adminCategoriesRoute
```

- [ ] **Step 4: Write tests/admin.test.ts**

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { getTestApp } from './helpers/app.js'
import { cleanDb, createCategory } from './helpers/fixtures.js'

describe('Admin API', () => {
  const app = getTestApp()
  const adminHeaders = { authorization: `Bearer ${process.env.ADMIN_SECRET ?? 'test-admin'}` }
  beforeAll(async () => { await app.ready() })
  afterAll(async () => { await app.close() })
  beforeEach(async () => { await cleanDb() })

  it('GET /admin/settings returns 401 without token', async () => {
    expect((await app.inject({ method: 'GET', url: '/admin/settings' })).statusCode).toBe(401)
  })

  it('GET /admin/settings returns 200 with token', async () => {
    expect((await app.inject({ method: 'GET', url: '/admin/settings', headers: adminHeaders })).statusCode).toBe(200)
  })

  it('PATCH /admin/settings updates adminTelegramId', async () => {
    const res = await app.inject({
      method: 'PATCH', url: '/admin/settings', headers: adminHeaders,
      body: { adminTelegramId: '123456789' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().adminTelegramId).toBe('123456789')
  })

  it('POST /admin/categories creates category', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/categories', headers: adminHeaders,
      body: { name: 'Bebidas', slug: 'bebidas' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().name).toBe('Bebidas')
  })

  it('GET /settings returns public store info', async () => {
    await app.inject({ method: 'PATCH', url: '/admin/settings', headers: adminHeaders, body: { storeName: 'Test Store' } })
    const res = await app.inject({ method: 'GET', url: '/settings' })
    expect(res.statusCode).toBe(200)
    expect(res.json().storeName).toBe('Test Store')
    expect(res.json().adminTelegramId).toBeUndefined()
  })
})
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/backend && npm test -- tests/admin.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/settings.ts backend/src/routes/admin/settings.ts backend/src/routes/admin/categories.ts backend/tests/admin.test.ts
git commit -m "feat: add public settings, admin settings with adminTelegramId, admin categories"
```

---

## Task 11: Users Route + Full Test Suite + Seed

- [ ] **Step 1: Create src/routes/users.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { requireUser } from '../lib/user-auth.js'

const usersRoute: FastifyPluginAsync = async (app) => {
  app.patch('/me/city', { preHandler: requireUser }, async (req, reply) => {
    const userId = (req as any).userId as string
    const { cityId } = req.body as { cityId: string }
    const user = await app.prisma.user.update({
      where: { id: userId },
      data: { selectedCityId: cityId },
      select: { id: true, telegramId: true, firstName: true, selectedCityId: true },
    })
    return reply.send({ ...user, telegramId: user.telegramId.toString() })
  })
}

export default usersRoute
```

Add to `src/index.ts` — import `usersRoute` and register with `app.register(usersRoute, { prefix: '/users' })`.

- [ ] **Step 2: Run full test suite**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/backend && npm test
```

Expected: all tests PASS

- [ ] **Step 3: Create prisma/seed.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.city.upsert({ where: { slug: 'sao-paulo' }, update: {}, create: { name: 'São Paulo', slug: 'sao-paulo', sortOrder: 1 } })
  await prisma.city.upsert({ where: { slug: 'rio-de-janeiro' }, update: {}, create: { name: 'Rio de Janeiro', slug: 'rio-de-janeiro', sortOrder: 2 } })
  await prisma.city.upsert({ where: { slug: 'belo-horizonte' }, update: {}, create: { name: 'Belo Horizonte', slug: 'belo-horizonte', sortOrder: 3 } })
  await prisma.city.upsert({ where: { slug: 'brasilia' }, update: {}, create: { name: 'Brasília', slug: 'brasilia', sortOrder: 4 } })

  const bebidas = await prisma.category.upsert({ where: { slug: 'bebidas' }, update: {}, create: { name: 'Bebidas', slug: 'bebidas', sortOrder: 1 } })
  const lanches = await prisma.category.upsert({ where: { slug: 'lanches' }, update: {}, create: { name: 'Lanches', slug: 'lanches', sortOrder: 2 } })

  await prisma.product.upsert({
    where: { slug: 'agua-mineral' }, update: {},
    create: { name: 'Água Mineral 500ml', slug: 'agua-mineral', description: 'Água mineral natural gelada', price: 3.5, stock: 100, categoryId: bebidas.id },
  })
  await prisma.product.upsert({
    where: { slug: 'x-burguer' }, update: {},
    create: { name: 'X-Burguer', slug: 'x-burguer', description: 'Hambúrguer artesanal com queijo', price: 24.9, stock: 50, categoryId: lanches.id },
  })

  await prisma.storeSetting.deleteMany()
  await prisma.storeSetting.create({
    data: { storeName: 'Lojinha', supportTelegramUrl: 'https://t.me/suporte', defaultLanguage: 'pt', welcomeText: 'Bem-vindo! Selecione sua cidade para começar.' },
  })

  console.log('Seed completed.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

- [ ] **Step 4: Run seed**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/backend && npm run db:seed
```

Expected: `Seed completed.`

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/users.ts backend/prisma/seed.ts backend/src/index.ts
git commit -m "feat: complete backend MVP with users route and seed data"
```
