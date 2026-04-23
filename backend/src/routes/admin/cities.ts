import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminCitiesRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async () => app.prisma.city.findMany({ orderBy: { sortOrder: 'asc' } }))

  app.post('/', async (req, reply) => {
    const { name, slug, sortOrder } = req.body as { name: string; slug: string; sortOrder?: number }
    return reply.status(201).send(await app.prisma.city.create({ data: { name, slug, sortOrder: sortOrder ?? 0 } }))
  })

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = req.body as Partial<{ name: string; isActive: boolean; sortOrder: number }>
    return reply.send(await app.prisma.city.update({ where: { id }, data }))
  })

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.city.delete({ where: { id } })
    return reply.status(204).send()
  })
}

export default adminCitiesRoute
