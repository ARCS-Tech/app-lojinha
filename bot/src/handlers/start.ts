import { CommandContext, Context } from 'grammy'
import { getCities } from '../lib/api.js'
import { buildCityKeyboard } from '../lib/keyboards.js'

export async function handleStart(ctx: CommandContext<Context>) {
  let cities: Awaited<ReturnType<typeof getCities>>
  try {
    cities = await getCities()
  } catch {
    await ctx.reply('Ops, não conseguimos carregar as cidades agora. Tente novamente em breve!')
    return
  }

  if (cities.length === 0) {
    await ctx.reply('Ops, nenhuma cidade disponível no momento. Tente novamente em breve!')
    return
  }

  await ctx.reply(
    '👋 Bem-vindo à Lojinha!\n\nPara continuar, selecione sua cidade:',
    { reply_markup: buildCityKeyboard(cities) }
  )
}
