import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanDb() {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.productMedia.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.city.deleteMany()
  await prisma.user.deleteMany()
  await prisma.storeSetting.deleteMany()
}

export async function createCity(overrides?: Partial<{ name: string; slug: string; isActive: boolean }>) {
  return prisma.city.create({
    data: { name: 'São Paulo', slug: `sao-paulo-${Date.now()}`, isActive: true, ...overrides },
  })
}

export async function createCategory(overrides?: Partial<{ name: string; slug: string }>) {
  return prisma.category.create({
    data: { name: 'Geral', slug: `geral-${Date.now()}`, isActive: true, ...overrides },
  })
}

export async function createProduct(categoryId: string, overrides?: Record<string, unknown>) {
  return prisma.product.create({
    data: {
      name: 'Produto Teste',
      slug: `produto-${Date.now()}`,
      price: 29.9,
      stock: 100,
      categoryId,
      isActive: true,
      ...overrides,
    },
  })
}

export async function createUser(overrides?: Record<string, unknown>) {
  return prisma.user.create({
    data: {
      telegramId: BigInt(Math.floor(Math.random() * 1e12)),
      firstName: 'Test',
      ...overrides,
    },
  })
}

export { prisma }
