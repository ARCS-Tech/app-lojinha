import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createHmac } from 'crypto'
import { getTestApp } from './helpers/app.js'
import { cleanDb, createCity, createCategory, createProduct } from './helpers/fixtures.js'

async function getAuthToken(app: ReturnType<typeof getTestApp>, telegramId = 77777) {
  const botToken = process.env.BOT_TOKEN ?? 'test-token'
  const authDate = Math.floor(Date.now() / 1000)
  const user = JSON.stringify({ id: telegramId, first_name: 'Test' })
  const dataCheckString = [`auth_date=${authDate}`, `user=${user}`].sort().join('\n')
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  const initData = new URLSearchParams({ auth_date: String(authDate), user, hash }).toString()
  const res = await app.inject({ method: 'POST', url: '/auth/telegram', body: { initData } })
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
