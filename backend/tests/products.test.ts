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
