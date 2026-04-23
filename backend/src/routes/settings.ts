import { FastifyPluginAsync } from 'fastify'

const settingsRoute: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    const s = await app.prisma.storeSetting.findFirst({
      select: { storeName: true, logoUrl: true, supportTelegramUrl: true, defaultLanguage: true },
    })
    return s ?? { storeName: 'Loja', logoUrl: null, supportTelegramUrl: null, defaultLanguage: 'pt' }
  })
}

export default settingsRoute
