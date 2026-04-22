import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyUserToken } from '../routes/auth.js'

export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Unauthorized' })
  try {
    const { userId } = verifyUserToken(authHeader.slice(7))
    ;(req as any).userId = userId
  } catch {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}
