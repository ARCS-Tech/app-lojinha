import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminProductsRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async () => {
    return app.prisma.product.findMany({
      include: { category: true, media: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const p = await app.prisma.product.findUnique({
      where: { id },
      include: { category: true, media: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!p) return reply.status(404).send({ error: 'Not found' })
    return p
  })

  app.post('/', async (req, reply) => {
    const body = req.body as {
      name: string; slug: string; description?: string; price: number
      categoryId: string; isActive?: boolean; stock?: number
      media?: Array<{ type: string; url: string; sortOrder?: number }>
    }
    const product = await app.prisma.product.create({
      data: {
        name: body.name, slug: body.slug, description: body.description,
        price: body.price, categoryId: body.categoryId,
        isActive: body.isActive ?? true, stock: body.stock ?? 0,
        media: body.media
          ? { create: body.media.map((m, i) => ({ ...m, sortOrder: m.sortOrder ?? i })) }
          : undefined,
      },
      include: { media: true },
    })
    return reply.status(201).send(product)
  })

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = req.body as Partial<{
      name: string; slug: string; description: string; price: number
      categoryId: string; isActive: boolean; stock: number
    }>
    return reply.send(await app.prisma.product.update({ where: { id }, data }))
  })

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await app.prisma.product.update({ where: { id }, data: { isActive: false } })
    return reply.status(204).send()
  })

  app.post('/:id/media', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { type, url, sortOrder } = req.body as { type: string; url: string; sortOrder?: number }
    return reply.status(201).send(
      await app.prisma.productMedia.create({ data: { productId: id, type, url, sortOrder: sortOrder ?? 0 } })
    )
  })

  app.delete('/:id/media/:mediaId', async (req, reply) => {
    const { mediaId } = req.params as { id: string; mediaId: string }
    await app.prisma.productMedia.delete({ where: { id: mediaId } })
    return reply.status(204).send()
  })
}

export default adminProductsRoute
