import { FastifyPluginAsync } from 'fastify'
import { Prisma } from '@prisma/client'
import { requireUser } from '../lib/user-auth.js'

const usersRoute: FastifyPluginAsync = async (app) => {
  app.patch('/me/city', { preHandler: requireUser }, async (req, reply) => {
    const userId = req.userId
    const { cityId } = req.body as { cityId: string }
    if (!cityId || typeof cityId !== 'string') {
      return reply.status(400).send({ error: 'cityId is required' })
    }
    try {
      const user = await app.prisma.user.update({
        where: { id: userId },
        data: { selectedCityId: cityId },
        select: { id: true, telegramId: true, firstName: true, selectedCityId: true },
      })
      return reply.send({ ...user, telegramId: user.telegramId.toString() })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        return reply.status(400).send({ error: 'Invalid cityId' })
      }
      throw err
    }
  })
}

export default usersRoute
