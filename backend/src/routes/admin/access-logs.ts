import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminAccessLogsRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async (req) => {
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

    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum

    const where = {
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
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
}

export default adminAccessLogsRoute
