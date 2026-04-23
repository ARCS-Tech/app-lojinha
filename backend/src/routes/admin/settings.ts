import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../lib/admin-auth.js'

const adminSettingsRoute: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin)

  app.get('/', async () => {
    const s = await app.prisma.storeSetting.findFirst()
    if (!s) return app.prisma.storeSetting.create({ data: { storeName: 'Minha Loja' } })
    return s
  })

  app.patch('/', async (req, reply) => {
    const data = req.body as Partial<{
      storeName: string; logoUrl: string; supportTelegramUrl: string
      adminTelegramId: string; defaultLanguage: string; welcomeText: string
    }>
    let s = await app.prisma.storeSetting.findFirst()
    if (!s) {
      s = await app.prisma.storeSetting.create({ data: { storeName: 'Minha Loja', ...data } })
    } else {
      s = await app.prisma.storeSetting.update({ where: { id: s.id }, data })
    }
    return reply.send(s)
  })
}

export default adminSettingsRoute
