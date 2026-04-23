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
