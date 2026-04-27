import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminAccessLogsRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async (req, reply) => {
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

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25))
    const skip = (pageNum - 1) * limitNum

    const fromDate = from ? new Date(from) : undefined
    const toDate = to ? new Date(to) : undefined

    if (fromDate && isNaN(fromDate.getTime())) {
      return reply.status(400).send({ error: 'Invalid `from` date' })
    }
    if (toDate && isNaN(toDate.getTime())) {
      return reply.status(400).send({ error: 'Invalid `to` date' })
    }

    const where = {
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
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

  app.get('/geo', async (req, reply) => {
    const { ip } = req.query as { ip?: string }
    if (!ip) return reply.status(400).send({ error: 'ip query param required' })

    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`)
      const data = await res.json() as { status: string; country?: string; countryCode?: string; city?: string }
      return {
        status: data.status === 'success' ? 'success' : 'fail',
        countryCode: data.countryCode ?? '',
        country: data.country ?? '',
        city: data.city ?? '',
      }
    } catch {
      return { status: 'fail', countryCode: '', country: '', city: '' }
    }
  })
}

export default adminAccessLogsRoute
