import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyUserToken } from '../routes/auth.js'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
  }
}

export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Unauthorized' })
  try {
    const { userId } = verifyUserToken(authHeader.slice(7))
    req.userId = userId
  } catch {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}
