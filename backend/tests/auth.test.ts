import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createHmac } from 'crypto'
import { getTestApp } from './helpers/app.js'
import { cleanDb } from './helpers/fixtures.js'

function buildValidInitData(botToken: string, userId = 123456789) {
  const authDate = Math.floor(Date.now() / 1000)
  const user = JSON.stringify({ id: userId, first_name: 'Test' })
  const dataCheckString = [`auth_date=${authDate}`, `user=${user}`].sort().join('\n')
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  return new URLSearchParams({ auth_date: String(authDate), user, hash }).toString()
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
})
