import { CallbackQueryContext, Context } from 'grammy'
import { buildOpenStoreKeyboard } from '../lib/keyboards.js'

export async function handleCityCallback(ctx: CallbackQueryContext<Context>) {
  const data = ctx.callbackQuery.data
  if (!data.startsWith('city:')) return

  const miniAppUrl = process.env.MINI_APP_URL ?? ''
  await ctx.answerCallbackQuery()
  await ctx.editMessageText('✅ Cidade selecionada!\n\nAgora você pode abrir a loja:', {
    reply_markup: { inline_keyboard: [] },
  })
  await ctx.reply('👇 Toque no botão abaixo para abrir a loja:', {
    reply_markup: buildOpenStoreKeyboard(miniAppUrl),
  })
}
