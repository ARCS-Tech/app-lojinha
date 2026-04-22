import { FastifyPluginAsync } from 'fastify'

const citiesRoute: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    return app.prisma.city.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    })
  })
}

export default citiesRoute
