import { FastifyPluginAsync } from 'fastify'
import { validateInitData } from '../lib/telegram-auth.js'
import { createHmac, timingSafeEqual } from 'crypto'

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
  const expectedBuf = Buffer.from(expected, 'hex')
  const receivedBuf = Buffer.from(sig, 'hex')
  if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
    throw new Error('Invalid token')
  }
  return JSON.parse(payload)
}

const authRoute: FastifyPluginAsync = async (app) => {
  app.post('/telegram', async (req, reply) => {
    const { initData } = req.body as { initData?: string }
    if (!initData) return reply.status(400).send({ error: 'initData required' })

    let telegramUser
    // Dev bypass: accept "dev:<json>" as initData when NODE_ENV is not production
    if (process.env.NODE_ENV !== 'production' && initData.startsWith('dev:')) {
      try {
        telegramUser = JSON.parse(initData.slice(4))
      } catch {
        return reply.status(400).send({ error: 'Invalid dev initData' })
      }
    } else {
      try {
        telegramUser = validateInitData(initData, process.env.BOT_TOKEN ?? 'test-token')
      } catch {
        return reply.status(401).send({ error: 'Invalid initData' })
      }
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
