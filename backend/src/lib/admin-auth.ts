import { FastifyRequest, FastifyReply } from 'fastify'

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Unauthorized' })
  const token = authHeader.slice(7)
  if (token !== (process.env.ADMIN_SECRET ?? 'test-admin')) {
    return reply.status(401).send({ error: 'Forbidden' })
  }
}
