import { FastifyPluginAsync } from 'fastify'
import { requireUser } from '../lib/user-auth.js'
import { sendAdminNotification } from '../lib/notify.js'

const ordersRoute: FastifyPluginAsync = async (app) => {
  app.post('/checkout', { preHandler: requireUser }, async (req, reply) => {
    const userId = req.userId
    const { cityId, items, notes } = req.body as {
      cityId: string
      items: Array<{ productId: string; quantity: number }>
      notes?: string
    }

    if (!items?.length) return reply.status(400).send({ error: 'items required' })

    const productIds = items.map((i) => i.productId)
    let order: any

    try {
      order = await app.prisma.$transaction(async (tx) => {
        const city = await tx.city.findUnique({ where: { id: cityId } })
        if (!city || !city.isActive) {
          const err = new Error('City not available') as any
          err.statusCode = 400
          throw err
        }

        const products = await tx.product.findMany({ where: { id: { in: productIds }, isActive: true } })

        if (products.length !== productIds.length) {
          const err = new Error('One or more products are unavailable') as any
          err.statusCode = 400
          throw err
        }

        const productMap = new Map(products.map((p) => [p.id, p]))

        for (const item of items) {
          const product = productMap.get(item.productId)!
          if (product.stock < item.quantity) {
            const err = new Error(`Estoque insuficiente: ${product.name}`) as any
            err.statusCode = 400
            throw err
          }
        }

        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }

        let totalAmount = 0
        const orderItems = items.map((item) => {
          const product = productMap.get(item.productId)!
          const unitPrice = Number(product.price)
          const lineTotal = unitPrice * item.quantity
          totalAmount += lineTotal
          return {
            productId: item.productId,
            productNameSnapshot: product.name,
            unitPriceSnapshot: unitPrice,
            quantity: item.quantity,
            lineTotal,
          }
        })

        return tx.order.create({
          data: { userId, cityId, status: 'submitted', totalAmount, notes, items: { create: orderItems } },
          include: { items: true, city: true, user: true },
        })
      })
    } catch (err: any) {
      if (err.statusCode === 400) return reply.status(400).send({ error: err.message })
      throw err
    }

    const settings = await app.prisma.storeSetting.findFirst()
    if (settings?.adminTelegramId && process.env.BOT_TOKEN) {
      sendAdminNotification(order, settings.adminTelegramId, process.env.BOT_TOKEN).catch(() => {})
    }

    return reply.status(201).send(order)
  })

  app.get('/me', { preHandler: requireUser }, async (req) => {
    const userId = req.userId
    return app.prisma.order.findMany({
      where: { userId },
      include: { items: true, city: true },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.get('/:id', { preHandler: requireUser }, async (req, reply) => {
    const userId = req.userId
    const { id } = req.params as { id: string }
    const order = await app.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, city: true },
    })
    if (!order) return reply.status(404).send({ error: 'Order not found' })
    return order
  })
}

export default ordersRoute
