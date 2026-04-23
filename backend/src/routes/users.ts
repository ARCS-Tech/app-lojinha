import { FastifyPluginAsync } from 'fastify'
import { requireUser } from '../lib/user-auth.js'

const usersRoute: FastifyPluginAsync = async (app) => {
  app.patch('/me/city', { preHandler: requireUser }, async (req, reply) => {
    const userId = req.userId
    const { cityId } = req.body as { cityId: string }
    const user = await app.prisma.user.update({
      where: { id: userId },
      data: { selectedCityId: cityId },
      select: { id: true, telegramId: true, firstName: true, selectedCityId: true },
    })
    return reply.send({ ...user, telegramId: user.telegramId.toString() })
  })
}

export default usersRoute
