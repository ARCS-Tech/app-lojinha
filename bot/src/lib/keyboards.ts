import { InlineKeyboard, Keyboard } from 'grammy'
import type { City } from './api.js'

export function buildCityKeyboard(cities: City[]): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const city of cities) {
    kb.text(city.name, `city:${city.id}`).row()
  }
  return kb
}

export function buildOpenStoreKeyboard(miniAppUrl: string): Keyboard {
  return new Keyboard().webApp('🛍️ Abrir loja', miniAppUrl).resized()
}
