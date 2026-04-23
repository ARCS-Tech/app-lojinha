import { CommandContext, Context } from 'grammy'
import { getCities } from '../lib/api.js'
import { buildCityKeyboard } from '../lib/keyboards.js'

export async function handleStart(ctx: CommandContext<Context>) {
  const cities = await getCities()

  if (cities.length === 0) {
    await ctx.reply('Ops, nenhuma cidade disponível no momento. Tente novamente em breve!')
    return
  }

  await ctx.reply(
    '👋 Bem-vindo à Lojinha!\n\nPara continuar, selecione sua cidade:',
    { reply_markup: buildCityKeyboard(cities) }
  )
}
