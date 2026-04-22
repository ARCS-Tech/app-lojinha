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
