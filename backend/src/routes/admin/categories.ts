import { FastifyPluginAsync } from 'fastify'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminCategoriesRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async () => app.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }))

  app.post('/', async (req, reply) => {
    const { name, slug, sortOrder } = req.body as { name: string; slug: string; sortOrder?: number }
    return reply.status(201).send(
      await app.prisma.category.create({ data: { name, slug, sortOrder: sortOrder ?? 0 } })
    )
  })

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = req.body as Partial<{ name: string; slug: string; isActive: boolean; sortOrder: number }>
    try {
      return reply.send(await app.prisma.category.update({ where: { id }, data }))
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return reply.status(404).send({ error: 'Not found' })
      }
      throw err
    }
  })

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      await app.prisma.category.delete({ where: { id } })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return reply.status(404).send({ error: 'Not found' })
      }
      throw err
    }
    return reply.status(204).send()
  })
}

export default adminCategoriesRoute
