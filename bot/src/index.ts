import 'dotenv/config'
import { Bot } from 'grammy'
import { handleStart } from './handlers/start.js'
import { handleCityCallback } from './handlers/cityCallback.js'

const token = process.env.BOT_TOKEN
if (!token) throw new Error('BOT_TOKEN is required')

const bot = new Bot(token)

bot.command('start', handleStart)
bot.callbackQuery(/^city:/, handleCityCallback)
bot.catch((err) => console.error('Bot error:', err))

console.log('Bot starting...')
bot.start()
