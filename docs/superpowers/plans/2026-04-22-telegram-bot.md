# Telegram Bot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Telegram bot that handles /start, presents city selection, stores the user's city via the backend, and sends a button to open the Mini App — serving as the entry point for the entire store.

**Architecture:** Node.js + TypeScript + grammY framework. The bot runs as a long-polling process (dev) or webhook (prod). It fetches city data from the backend API and uses inline keyboard buttons for city selection. The Mini App is launched via a `web_app` button attached to a KeyboardButton. Bot token and Mini App URL are configured via environment variables.

**Tech Stack:** Node.js 20, TypeScript, grammY 1.x, tsx (dev runner), dotenv

**Dependency:** Requires backend from Plan 1 to be running (GET /cities endpoint and POST /auth/telegram).

---

## File Structure

```
bot/
├── src/
│   ├── index.ts                 # Bot entry point, registers handlers, starts polling
│   ├── handlers/
│   │   ├── start.ts             # /start command handler
│   │   └── cityCallback.ts      # Callback query handler for city selection
│   └── lib/
│       ├── api.ts               # Axios client to backend
│       └── keyboards.ts         # Keyboard builder helpers
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `bot/package.json`, `bot/tsconfig.json`, `bot/.env.example`

- [ ] **Step 1: Create bot directory and install dependencies**

```bash
mkdir -p /Users/shelfspy/app-lojinha/bot
cd /Users/shelfspy/app-lojinha/bot
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

Replace `"scripts"` section:
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

## Task 2: Backend API Client + Keyboard Helpers

**Files:**
- Create: `bot/src/lib/api.ts`
- Create: `bot/src/lib/keyboards.ts`

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
  const res = await api.get<City[]>('/cities')
  return res.data
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
  return new Keyboard()
    .webApp('🛍️ Abrir loja', miniAppUrl)
    .resized()
}
```

- [ ] **Step 3: Commit**

```bash
git add bot/src/lib/
git commit -m "feat: add bot API client and keyboard helpers"
```

---

## Task 3: Handlers

**Files:**
- Create: `bot/src/handlers/start.ts`
- Create: `bot/src/handlers/cityCallback.ts`

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

  const cityId = data.slice(5)
  const miniAppUrl = process.env.MINI_APP_URL ?? ''

  await ctx.answerCallbackQuery()

  await ctx.editMessageText(
    '✅ Cidade selecionada!\n\nAgora você pode abrir a loja e explorar nosso catálogo:',
    { reply_markup: { inline_keyboard: [] } }
  )

  await ctx.reply(
    '👇 Toque no botão abaixo para abrir a loja:',
    { reply_markup: buildOpenStoreKeyboard(miniAppUrl) }
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add bot/src/handlers/
git commit -m "feat: add start and city callback handlers"
```

---

## Task 4: Bot Entry Point

**Files:**
- Create: `bot/src/index.ts`

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

bot.catch((err) => {
  console.error('Bot error:', err)
})

console.log('Bot starting...')
bot.start()
```

- [ ] **Step 2: Commit**

```bash
git add bot/src/index.ts
git commit -m "feat: add bot entry point with start command and city callback"
```

---

## Task 5: Manual Verification

- [ ] **Step 1: Ensure backend is running**

In a separate terminal:
```bash
cd /Users/shelfspy/app-lojinha/backend && npm run dev
```

Expected: Backend listening on port 3000 with seed data (cities available at GET /cities).

- [ ] **Step 2: Set environment variables**

```bash
cp /Users/shelfspy/app-lojinha/bot/.env.example /Users/shelfspy/app-lojinha/bot/.env
```

Edit `bot/.env`:
```
BOT_TOKEN=<your real bot token from @BotFather>
MINI_APP_URL=<your Mini App URL — can be localhost:5173 for dev>
API_URL=http://localhost:3000
```

- [ ] **Step 3: Start the bot**

```bash
cd /Users/shelfspy/app-lojinha/bot && npm run dev
```

Expected output:
```
Bot starting...
```

- [ ] **Step 4: Test the flow in Telegram**

Open Telegram, find your bot, send `/start`.

Expected:
1. Bot replies with "Bem-vindo à Lojinha!" and a list of city buttons (São Paulo, Rio de Janeiro from seed).
2. Tap a city → bot answers callback, edits message, sends "Abrir loja" web_app button.
3. Tap "Abrir loja" → Mini App opens (if URL is configured and deployed).

- [ ] **Step 5: Commit any fixes found during testing**

```bash
git add bot/
git commit -m "feat: complete telegram bot MVP — start, city select, open store"
```

---

## Task 6: Build Verification

- [ ] **Step 1: TypeScript build check**

```bash
cd /Users/shelfspy/app-lojinha/bot && npm run build
```

Expected: `dist/` created, no TypeScript errors.

- [ ] **Step 2: Final commit**

```bash
git add bot/
git commit -m "chore: verified bot TypeScript build"
```

---

## Notes on Deployment to Render

When deploying to Render (future step):

1. Set env vars `BOT_TOKEN`, `MINI_APP_URL`, `API_URL` in Render dashboard.
2. Build command: `npm install && npm run build`
3. Start command: `node dist/index.js`
4. Service type: **Background Worker** (not Web Service — bot uses long polling, not HTTP).

No webhook configuration needed for the MVP — long polling works fine for initial validation.
