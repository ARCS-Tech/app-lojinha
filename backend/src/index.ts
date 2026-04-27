import Fastify from 'fastify'
import cors from '@fastify/cors'
import prismaPlugin from './plugins/prisma.js'
import authRoute from './routes/auth.js'
import citiesRoute from './routes/cities.js'
import categoriesRoute from './routes/categories.js'
import productsRoute from './routes/products.js'
import ordersRoute from './routes/orders.js'
import settingsRoute from './routes/settings.js'
import adminProductsRoute from './routes/admin/products.js'
import adminOrdersRoute from './routes/admin/orders.js'
import adminCitiesRoute from './routes/admin/cities.js'
import adminCategoriesRoute from './routes/admin/categories.js'
import adminSettingsRoute from './routes/admin/settings.js'
import adminAccessLogsRoute from './routes/admin/access-logs.js'
import usersRoute from './routes/users.js'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(cors, { origin: true })
  app.register(prismaPlugin)

  app.register(authRoute, { prefix: '/auth' })
  app.register(citiesRoute, { prefix: '/cities' })
  app.register(categoriesRoute, { prefix: '/categories' })
  app.register(productsRoute, { prefix: '/products' })
  app.register(ordersRoute, { prefix: '/orders' })
  app.register(settingsRoute, { prefix: '/settings' })
  app.register(usersRoute, { prefix: '/users' })

  app.register(adminProductsRoute, { prefix: '/admin/products' })
  app.register(adminOrdersRoute, { prefix: '/admin/orders' })
  app.register(adminCitiesRoute, { prefix: '/admin/cities' })
  app.register(adminCategoriesRoute, { prefix: '/admin/categories' })
  app.register(adminSettingsRoute, { prefix: '/admin/settings' })
  app.register(adminAccessLogsRoute, { prefix: '/admin/access-logs' })

  return app
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const app = buildApp()
  await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
}
