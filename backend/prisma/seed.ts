import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.city.upsert({ where: { slug: 'sao-paulo' }, update: {}, create: { name: 'São Paulo', slug: 'sao-paulo', sortOrder: 1 } })
  await prisma.city.upsert({ where: { slug: 'rio-de-janeiro' }, update: {}, create: { name: 'Rio de Janeiro', slug: 'rio-de-janeiro', sortOrder: 2 } })
  await prisma.city.upsert({ where: { slug: 'belo-horizonte' }, update: {}, create: { name: 'Belo Horizonte', slug: 'belo-horizonte', sortOrder: 3 } })
  await prisma.city.upsert({ where: { slug: 'brasilia' }, update: {}, create: { name: 'Brasília', slug: 'brasilia', sortOrder: 4 } })

  const bebidas = await prisma.category.upsert({ where: { slug: 'bebidas' }, update: {}, create: { name: 'Bebidas', slug: 'bebidas', sortOrder: 1 } })
  const lanches = await prisma.category.upsert({ where: { slug: 'lanches' }, update: {}, create: { name: 'Lanches', slug: 'lanches', sortOrder: 2 } })

  await prisma.product.upsert({
    where: { slug: 'agua-mineral' }, update: {},
    create: { name: 'Água Mineral 500ml', slug: 'agua-mineral', description: 'Água mineral natural gelada', price: 3.5, stock: 100, categoryId: bebidas.id },
  })
  await prisma.product.upsert({
    where: { slug: 'x-burguer' }, update: {},
    create: { name: 'X-Burguer', slug: 'x-burguer', description: 'Hambúrguer artesanal com queijo', price: 24.9, stock: 50, categoryId: lanches.id },
  })

  await prisma.storeSetting.deleteMany()
  await prisma.storeSetting.create({
    data: { storeName: 'Lojinha', supportTelegramUrl: 'https://t.me/suporte', defaultLanguage: 'pt', welcomeText: 'Bem-vindo! Selecione sua cidade para começar.' },
  })

  console.log('Seed completed.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
