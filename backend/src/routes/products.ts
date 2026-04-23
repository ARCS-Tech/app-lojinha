import { FastifyPluginAsync } from 'fastify'

const productsRoute: FastifyPluginAsync = async (app) => {
  app.get('/', async (req) => {
    const { categoryId, search } = req.query as { categoryId?: string; search?: string }
    return app.prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: {
        media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const product = await app.prisma.product.findFirst({
      where: { id, isActive: true },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true } },
      },
    })
    if (!product) return reply.status(404).send({ error: 'Product not found' })
    return product
  })
}

export default productsRoute
