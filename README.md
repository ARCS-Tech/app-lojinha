# app-lojinha

A full-stack Telegram Mini App storefront for alcoholic beverage shops. Customers browse and order directly inside Telegram; the store owner manages everything from a web admin panel.

## Architecture

```
app-lojinha/
├── backend/     Fastify REST API + Prisma ORM (PostgreSQL)
├── mini-app/    Telegram Mini App (React + Tailwind v4)
├── admin/       Admin panel (React + Tailwind)
└── bot/         Telegram bot entry point (grammY)
```

## Features

- **Mini App** — dark-themed storefront with dynamic brand colors set by the admin. Customers browse products by category, view a media gallery, add to cart, and place orders — all inside Telegram.
- **Admin panel** — manage products, categories, cities, orders, and store settings (including primary/secondary brand colors that update the Mini App in real time without a rebuild).
- **Bot** — greets users, lets them choose a city, and opens the Mini App.
- **Backend** — REST API with Telegram `initData` authentication for users and a Bearer token for admins. Stock validation, order management, and Telegram notifications on new orders.

## Tech Stack

| Layer | Stack |
|---|---|
| Backend | Fastify 4, Prisma 6, PostgreSQL, TypeScript, Vitest |
| Mini App | React 19, Vite, Tailwind v4, TanStack Query v5, Zustand |
| Admin | React 19, Vite, Tailwind, TanStack Query v5, react-hook-form |
| Bot | grammY, TypeScript |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL running locally

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, BOT_TOKEN, ADMIN_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev            # starts on port 3000
```

### 2. Mini App

```bash
cd mini-app
cp .env.example .env   # set VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

### 3. Admin Panel

```bash
cd admin
cp .env.example .env   # set VITE_API_URL=http://localhost:3000, VITE_ADMIN_SECRET=...
npm install
npm run dev
```

### 4. Bot

```bash
cd bot
cp .env.example .env   # fill in BOT_TOKEN, API_URL, MINI_APP_URL
npm install
npm run dev
```

## Environment Variables

### backend/.env

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BOT_TOKEN` | Telegram bot token from @BotFather |
| `ADMIN_SECRET` | Bearer token for admin API access |
| `PORT` | HTTP port (default 3000) |

## Running Tests

```bash
cd backend
npm test
```

## Dynamic Brand Colors

The Mini App reads `primaryColor` and `secondaryColor` from the `/settings` endpoint and injects them as CSS custom properties at runtime. Changing the colors in the admin panel updates the entire Mini App UI instantly — no rebuild required.
