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
