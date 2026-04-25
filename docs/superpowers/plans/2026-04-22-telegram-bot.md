# Telegram Bot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Telegram bot that handles /start, presents city selection, and sends a button to open the Mini App — serving as the entry point for the store.

**Architecture:** Node.js + TypeScript + grammY. Long-polling in dev, webhook in prod. Fetches cities from backend API. City selection stores `selectedCityId` via backend PATCH endpoint.

**Tech Stack:** Node.js 20, TypeScript, grammY 1.x, tsx, dotenv

**Dependency:** Requires backend running with `GET /cities` and `PATCH /users/me/city` available.

---

## File Structure

```
bot/
├── src/
│   ├── index.ts
│   ├── handlers/
│   │   ├── start.ts
│   │   └── cityCallback.ts
│   └── lib/
│       ├── api.ts
│       └── keyboards.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Task 1: Project Bootstrap

- [ ] **Step 1: Create bot directory and install dependencies**

```bash
mkdir -p /Users/hover/Desktop/Programas/app-lojinha/bot
cd /Users/hover/Desktop/Programas/app-lojinha/bot
npm init -y
npm install grammy axios dotenv
npm install -D typescript tsx @types/node
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Add scripts to package.json**

```json
"scripts": {
  "dev": "tsx --env-file=.env src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

- [ ] **Step 4: Create .env.example**

```
BOT_TOKEN=your-telegram-bot-token
MINI_APP_URL=https://your-mini-app-url.com
API_URL=http://localhost:3000
```

Copy to `.env` and fill with real values.

- [ ] **Step 5: Commit**

```bash
git add bot/
git commit -m "feat: bootstrap telegram bot project"
```

---

## Task 2: API Client + Keyboard Helpers

- [ ] **Step 1: Create src/lib/api.ts**

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.API_URL ?? 'http://localhost:3000',
  timeout: 5000,
})

export interface City {
  id: string
  name: string
  slug: string
}

export async function getCities(): Promise<City[]> {
  return (await api.get<City[]>('/cities')).data
}
```

- [ ] **Step 2: Create src/lib/keyboards.ts**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add bot/src/lib/
git commit -m "feat: add bot API client and keyboard helpers"
```

---

## Task 3: Handlers

- [ ] **Step 1: Create src/handlers/start.ts**

```typescript
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
```

- [ ] **Step 2: Create src/handlers/cityCallback.ts**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add bot/src/handlers/
git commit -m "feat: add start and city callback handlers"
```

---

## Task 4: Bot Entry Point

- [ ] **Step 1: Create src/index.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add bot/src/index.ts
git commit -m "feat: add bot entry point"
```

---

## Task 5: Manual Verification

- [ ] **Step 1: Ensure backend is running**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/backend && npm run dev
```

- [ ] **Step 2: Set environment variables**

```bash
cp /Users/hover/Desktop/Programas/app-lojinha/bot/.env.example /Users/hover/Desktop/Programas/app-lojinha/bot/.env
```

Edit `bot/.env` with real `BOT_TOKEN` and `MINI_APP_URL`.

- [ ] **Step 3: Start the bot**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/bot && npm run dev
```

Expected: `Bot starting...`

- [ ] **Step 4: Test in Telegram**

Send `/start` to your bot. Expected:
1. Bot replies with city buttons
2. Tap city → bot sends "Abrir loja" button
3. Tap button → Mini App opens

- [ ] **Step 5: Build check**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/bot && npm run build
```

Expected: `dist/` created, no TypeScript errors.

- [ ] **Step 6: Final commit**

```bash
git add bot/
git commit -m "feat: complete telegram bot MVP"
```
