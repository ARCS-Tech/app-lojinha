import { FastifyPluginAsync } from 'fastify'

const categoriesRoute: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    return app.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    })
  })
}

export default categoriesRoute
