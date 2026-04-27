import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { getTestApp } from './helpers/app.js'
import { cleanDb, createUser, prisma } from './helpers/fixtures.js'

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
    const user = await createUser()
    await prisma.accessLog.createMany({
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
    await prisma.accessLog.createMany({
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

  it('GET /settings returns public store info', async () => {
    await app.inject({ method: 'PATCH', url: '/admin/settings', headers: adminHeaders, body: { storeName: 'Test Store' } })
    const res = await app.inject({ method: 'GET', url: '/settings' })
    expect(res.statusCode).toBe(200)
    expect(res.json().storeName).toBe('Test Store')
    expect(res.json().adminTelegramId).toBeUndefined()
  })
})
