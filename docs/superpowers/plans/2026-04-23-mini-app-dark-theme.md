# Mini App Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Mini App with a premium dark theme for alcoholic beverage stores, with dynamic primary/secondary brand colors set by the admin via the settings panel — no rebuild required when colors change.

**Architecture:** CSS Custom Properties defined in `index.css` via Tailwind v4 `@theme {}` become utility classes (`bg-primary`, `text-secondary`, etc.). On boot, `useStoreSettings` fetches `GET /settings` and calls `applyTheme()` which sets `--color-primary`, `--color-secondary`, and derived variables on `document.documentElement`. All components consume these via Tailwind classes. The Telegram `--tg-theme-*` variables are removed entirely — the app forces its own dark palette.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, TanStack Query v5, Prisma, PostgreSQL, react-hook-form (admin only)

**Worktree path:** `/Users/hover/Desktop/Programas/app-lojinha/.worktrees/telegram-store`

---

## File Map

| File | Action | Notes |
|---|---|---|
| `backend/prisma/schema.prisma` | Modify | Add `primaryColor`, `secondaryColor` to `StoreSetting` |
| `backend/prisma/migrations/20260423000000_add_theme_colors/migration.sql` | Create | ALTER TABLE migration |
| `mini-app/src/index.css` | Replace | Full dark theme, remove tg-* vars |
| `mini-app/src/hooks/useStoreSettings.ts` | Modify | Add fields + `applyTheme()` call |
| `mini-app/src/components/Header.tsx` | Modify | Dark classes |
| `mini-app/src/components/CategoryBar.tsx` | Modify | Dark classes |
| `mini-app/src/components/StatusBadge.tsx` | Modify | Dark variant colors |
| `mini-app/src/components/MediaGallery.tsx` | Modify | Dark classes |
| `mini-app/src/components/CartFAB.tsx` | Modify | Dark classes + glow shadow |
| `mini-app/src/components/SupportFAB.tsx` | Modify | Dark classes |
| `mini-app/src/components/ProductCard.tsx` | Replace | New layout: `aspect-[3/4]`, gradient overlay, text on image |
| `mini-app/src/pages/Catalog.tsx` | Modify | Dark classes |
| `mini-app/src/pages/ProductDetail.tsx` | Modify | Dark classes |
| `mini-app/src/pages/Cart.tsx` | Modify | Dark classes |
| `mini-app/src/pages/Orders.tsx` | Modify | Dark classes |
| `mini-app/src/pages/OrderDetail.tsx` | Modify | Dark classes |
| `mini-app/src/pages/OrderConfirm.tsx` | Modify | Dark classes + success icon |
| `mini-app/src/pages/CitySelect.tsx` | Modify | Dark classes |
| `mini-app/src/pages/AuthGate.tsx` | Modify | Dark classes |
| `admin/src/hooks/useAdminSettings.ts` | Modify | Add `primaryColor`, `secondaryColor` to interface |
| `admin/src/pages/settings/StoreSettings.tsx` | Modify | Add color picker inputs |

---

## Task 1: Backend Schema Migration

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260423000000_add_theme_colors/migration.sql`

- [ ] **Step 1: Add fields to schema.prisma**

Open `backend/prisma/schema.prisma`. The `StoreSetting` model currently ends before the `@@map` line. Add two fields:

```prisma
model StoreSetting {
  id                 String   @id @default(cuid())
  storeName          String   @default("Minha Loja")
  logoUrl            String?
  supportTelegramUrl String?
  adminTelegramId    String?
  defaultLanguage    String   @default("pt")
  welcomeText        String?
  primaryColor       String   @default("#7c3aed")
  secondaryColor     String   @default("#a78bfa")
  updatedAt          DateTime @updatedAt

  @@map("store_settings")
}
```

- [ ] **Step 2: Create migration directory and SQL file**

Create directory `backend/prisma/migrations/20260423000000_add_theme_colors/` and write `migration.sql`:

```sql
-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN "primaryColor" TEXT NOT NULL DEFAULT '#7c3aed';
ALTER TABLE "store_settings" ADD COLUMN "secondaryColor" TEXT NOT NULL DEFAULT '#a78bfa';
```

- [ ] **Step 3: Apply migration**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/.worktrees/telegram-store/backend
npx prisma migrate deploy
```

Expected output: `1 migration applied`

- [ ] **Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client`

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/20260423000000_add_theme_colors/
git commit -m "feat: add primaryColor and secondaryColor to StoreSetting"
```

---

## Task 2: CSS Dark Theme

**Files:**
- Replace: `mini-app/src/index.css`

- [ ] **Step 1: Replace index.css entirely**

```css
@import "tailwindcss";

@theme {
  --color-bg: #0d0d12;
  --color-surface: #16161e;
  --color-surface-2: #1e1e28;
  --color-border: #2a2a38;
  --color-text: #f0f0f5;
  --color-muted: #6b6b80;
  --color-error: #f87171;
  --color-success: #4ade80;
  --color-primary: #7c3aed;
  --color-primary-soft: rgba(124, 58, 237, 0.15);
  --color-primary-glow: rgba(124, 58, 237, 0.4);
  --color-secondary: #a78bfa;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  color-scheme: dark;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

Note: Tailwind v4 `@theme {}` registers each `--color-*` variable as a utility class. `--color-bg` → `bg-bg`, `text-bg`; `--color-surface` → `bg-surface`; `--color-primary` → `bg-primary`, `text-primary`, `border-primary`, etc. Runtime JS `setProperty` overrides work because the generated CSS uses `var(--color-*)` internally.

- [ ] **Step 2: Verify CSS compiles**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/.worktrees/telegram-store/mini-app
npm run build 2>&1 | head -20
```

Expected: No CSS errors (TypeScript errors are expected — classes not yet updated in components).

- [ ] **Step 3: Commit**

```bash
git add mini-app/src/index.css
git commit -m "feat: add dark theme CSS custom properties"
```

---

## Task 3: useStoreSettings Hook — applyTheme

**Files:**
- Modify: `mini-app/src/hooks/useStoreSettings.ts`

- [ ] **Step 1: Replace the hook file**

```typescript
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface StoreSettings {
  storeName: string
  logoUrl?: string | null
  supportTelegramUrl?: string | null
  defaultLanguage: string
  primaryColor: string
  secondaryColor: string
}

function applyTheme(primaryColor: string, secondaryColor: string) {
  const root = document.documentElement
  root.style.setProperty('--color-primary', primaryColor)
  root.style.setProperty('--color-secondary', secondaryColor)
  const r = parseInt(primaryColor.slice(1, 3), 16)
  const g = parseInt(primaryColor.slice(3, 5), 16)
  const b = parseInt(primaryColor.slice(5, 7), 16)
  root.style.setProperty('--color-primary-soft', `rgba(${r},${g},${b},0.15)`)
  root.style.setProperty('--color-primary-glow', `rgba(${r},${g},${b},0.4)`)
}

export function useStoreSettings() {
  const query = useQuery<StoreSettings>({
    queryKey: ['store-settings'],
    queryFn: async () => (await api.get('/settings')).data,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (query.data?.primaryColor && query.data?.secondaryColor) {
      applyTheme(query.data.primaryColor, query.data.secondaryColor)
    }
  }, [query.data])

  return query
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/.worktrees/telegram-store/mini-app
npx tsc --noEmit 2>&1 | grep useStoreSettings
```

Expected: no errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add mini-app/src/hooks/useStoreSettings.ts
git commit -m "feat: apply dynamic theme colors from settings"
```

---

## Task 4: Components — Header, CategoryBar, StatusBadge, MediaGallery

**Files:**
- Modify: `mini-app/src/components/Header.tsx`
- Modify: `mini-app/src/components/CategoryBar.tsx`
- Modify: `mini-app/src/components/StatusBadge.tsx`
- Modify: `mini-app/src/components/MediaGallery.tsx`

- [ ] **Step 1: Replace Header.tsx**

```tsx
import { useEffect } from 'react'
import { useTranslation, setLanguage } from '@/hooks/useTranslation'
import type { Lang } from '@/hooks/useTranslation'
import { useStoreSettings } from '@/hooks/useStoreSettings'

export default function Header() {
  const { lang } = useTranslation()
  const { data: settings } = useStoreSettings()

  useEffect(() => {
    if (settings?.defaultLanguage && !localStorage.getItem('lojinha-lang')) {
      const l = settings.defaultLanguage as Lang
      setLanguage(l)
    }
  }, [settings?.defaultLanguage])

  return (
    <header className="sticky top-0 z-20 bg-bg backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
      <h1 className="font-bold text-lg text-text truncate">{settings?.storeName ?? 'Loja'}</h1>
      <div className="flex gap-1 flex-none">
        {(['pt', 'es', 'en'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLanguage(l)}
            className={`px-2 py-1 rounded text-xs font-medium uppercase transition-colors ${
              lang === l ? 'bg-primary text-white' : 'bg-surface-2 text-muted'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Replace CategoryBar.tsx**

```tsx
import type { Category } from '@/hooks/useCategories'
import { t } from '@/hooks/useTranslation'

interface Props { categories: Category[]; selected: string | null; onSelect: (id: string | null) => void }

export default function CategoryBar({ categories, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      <button
        onClick={() => onSelect(null)}
        className={`flex-none px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selected === null ? 'bg-primary text-white' : 'bg-surface-2 text-muted'
        }`}
      >
        {t('all_categories')}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex-none px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected === cat.id ? 'bg-primary text-white' : 'bg-surface-2 text-muted'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Replace StatusBadge.tsx**

```tsx
import { t } from '@/hooks/useTranslation'

const STATUS_KEYS: Record<string, 'status_submitted' | 'status_in_review' | 'status_confirmed' | 'status_cancelled'> = {
  submitted: 'status_submitted',
  in_review: 'status_in_review',
  confirmed: 'status_confirmed',
  cancelled: 'status_cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-amber-500/15 text-amber-400',
  in_review: 'bg-blue-500/15 text-blue-400',
  confirmed: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-red-500/15 text-red-400',
}

export default function StatusBadge({ status }: { status: string }) {
  const key = STATUS_KEYS[status]
  const label = key ? t(key) : status
  const color = STATUS_COLORS[status] ?? 'bg-surface-2 text-muted'
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>
}
```

- [ ] **Step 4: Replace MediaGallery.tsx**

```tsx
import { useState } from 'react'

interface MediaItem { url: string; type: string }

export default function MediaGallery({ media }: { media: MediaItem[] }) {
  const [current, setCurrent] = useState(0)
  if (media.length === 0) {
    return <div className="aspect-square w-full bg-surface flex items-center justify-center text-6xl">🛍️</div>
  }
  return (
    <div>
      <div className="aspect-square w-full bg-surface overflow-hidden">
        {media[current].type === 'video'
          ? <video src={media[current].url} controls className="w-full h-full object-cover" />
          : <img src={media[current].url} alt="" className="w-full h-full object-cover" />}
      </div>
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3 bg-surface no-scrollbar">
          {media.map((m, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`flex-none w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current ? 'border-primary' : 'border-transparent'
              }`}>
              {m.type === 'video'
                ? <div className="w-full h-full bg-surface-2 flex items-center justify-center text-2xl">▶️</div>
                : <img src={m.url} alt="" className="w-full h-full object-cover" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add mini-app/src/components/Header.tsx mini-app/src/components/CategoryBar.tsx mini-app/src/components/StatusBadge.tsx mini-app/src/components/MediaGallery.tsx
git commit -m "feat: apply dark theme to Header, CategoryBar, StatusBadge, MediaGallery"
```

---

## Task 5: ProductCard — Gradient Overlay Redesign

**Files:**
- Replace: `mini-app/src/components/ProductCard.tsx`

This is a structural change: the old card had `aspect-square` + text below the image. The new card uses `aspect-[3/4]` (portrait) with image filling the card, a vertical gradient overlay at the bottom, and product name/price rendered on top of the gradient.

- [ ] **Step 1: Replace ProductCard.tsx**

```tsx
import { useNavigate } from 'react-router-dom'
import type { ProductSummary } from '@/hooks/useProducts'
import { t } from '@/hooks/useTranslation'

export default function ProductCard({ product }: { product: ProductSummary }) {
  const navigate = useNavigate()
  const image = product.media[0]?.url
  const outOfStock = product.stock === 0

  return (
    <button
      onClick={() => navigate(`/products/${product.id}`)}
      className="block text-left bg-surface rounded-2xl overflow-hidden active:opacity-80 transition-opacity relative w-full aspect-[3/4]"
    >
      {image ? (
        <img
          src={image}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover ${outOfStock ? 'opacity-50' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center text-muted text-4xl">🛍️</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
      {outOfStock && (
        <div className="absolute top-2 left-2 bg-error/15 text-error text-xs font-bold px-2 py-1 rounded-full">
          {t('out_of_stock')}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-medium text-sm text-white leading-tight line-clamp-2">{product.name}</p>
        <p className={`font-bold mt-1 text-sm ${outOfStock ? 'text-muted' : 'text-secondary'}`}>
          R$ {Number(product.price).toFixed(2)}
        </p>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/.worktrees/telegram-store/mini-app
npx tsc --noEmit 2>&1 | grep ProductCard
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mini-app/src/components/ProductCard.tsx
git commit -m "feat: redesign ProductCard with portrait aspect ratio and gradient overlay"
```

---

## Task 6: CartFAB + SupportFAB

**Files:**
- Modify: `mini-app/src/components/CartFAB.tsx`
- Modify: `mini-app/src/components/SupportFAB.tsx`

- [ ] **Step 1: Replace CartFAB.tsx**

The FAB has a colored glow shadow using `--color-primary-glow` (set by `applyTheme()` as `rgba(r,g,b,0.4)`).

```tsx
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'

export default function CartFAB() {
  const navigate = useNavigate()
  const count = useCartStore((s) => s.count())
  if (count === 0) return null
  return (
    <button
      onClick={() => navigate('/cart')}
      className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center text-2xl z-50 active:opacity-70"
      style={{ boxShadow: '0 4px 24px var(--color-primary-glow)' }}
    >
      🛒
      <span className="absolute -top-1 -right-1 bg-error text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    </button>
  )
}
```

- [ ] **Step 2: Replace SupportFAB.tsx**

```tsx
import { tg } from '@/lib/telegram'
import { useStoreSettings } from '@/hooks/useStoreSettings'

export default function SupportFAB() {
  const { data: settings } = useStoreSettings()
  if (!settings?.supportTelegramUrl) return null
  return (
    <button
      onClick={() => tg?.openTelegramLink(settings.supportTelegramUrl!)}
      className="fixed bottom-6 left-6 w-14 h-14 bg-surface-2 rounded-full shadow-lg flex items-center justify-center text-2xl z-50 active:opacity-70"
    >
      💬
    </button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add mini-app/src/components/CartFAB.tsx mini-app/src/components/SupportFAB.tsx
git commit -m "feat: apply dark theme to CartFAB and SupportFAB"
```

---

## Task 7: Pages — Catalog + ProductDetail

**Files:**
- Modify: `mini-app/src/pages/Catalog.tsx`
- Modify: `mini-app/src/pages/ProductDetail.tsx`

- [ ] **Step 1: Replace Catalog.tsx**

```tsx
import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import ProductCard from '@/components/ProductCard'
import CategoryBar from '@/components/CategoryBar'
import CartFAB from '@/components/CartFAB'
import SupportFAB from '@/components/SupportFAB'
import { t } from '@/hooks/useTranslation'

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { data: products, isLoading } = useProducts({
    categoryId: selectedCategory ?? undefined,
    search: search || undefined,
  })
  const { data: categories } = useCategories()

  return (
    <div className="pb-24 bg-bg min-h-screen">
      <div className="sticky top-0 z-10 bg-bg pt-3 pb-3 px-4 space-y-3">
        <input
          type="search"
          placeholder={t('search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-text outline-none focus:border-primary transition-colors placeholder:text-muted"
        />
        {categories && (
          <CategoryBar categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
        )}
      </div>

      <div className="px-4">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[3/4] bg-surface rounded-2xl animate-pulse" />)}
          </div>
        )}
        {products?.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p className="text-4xl mb-3">🔍</p>
            <p>{t('no_products')}</p>
          </div>
        )}
        {products && products.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      <CartFAB />
      <SupportFAB />
    </div>
  )
}
```

- [ ] **Step 2: Replace ProductDetail.tsx**

```tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProduct } from '@/hooks/useProduct'
import { useCartStore } from '@/store/cartStore'
import MediaGallery from '@/components/MediaGallery'
import { t } from '@/hooks/useTranslation'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading } = useProduct(id!)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  function handleAddToCart() {
    if (!product || product.stock === 0) return
    addItem({ productId: product.id, name: product.name, price: Number(product.price), quantity, imageUrl: product.media[0]?.url })
    navigate(-1)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="aspect-square w-full bg-surface animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-6 bg-surface rounded animate-pulse" />
          <div className="h-4 bg-surface rounded w-1/3 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!product) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><p className="text-muted">{t('product_not_found')}</p></div>
  }

  const outOfStock = product.stock === 0

  return (
    <div className="pb-32 bg-bg min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 w-9 h-9 bg-surface/80 backdrop-blur rounded-full flex items-center justify-center text-lg text-text"
      >
        {t('back')}
      </button>

      <MediaGallery media={product.media} />

      <div className="p-4 space-y-4">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-primary-soft text-secondary">
            {product.category.name}
          </span>
          <h1 className="text-xl font-bold text-text mt-2">{product.name}</h1>
          <p className="text-2xl font-bold text-secondary mt-2">R$ {Number(product.price).toFixed(2)}</p>
          {outOfStock && (
            <p className="text-sm text-error font-medium mt-1">{t('out_of_stock')}</p>
          )}
        </div>
        {product.description && (
          <p className="text-sm text-muted leading-relaxed">{product.description}</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-border">
        <div className="flex items-center gap-4">
          {!outOfStock && (
            <div className="flex items-center gap-3 bg-surface-2 rounded-xl px-1">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 flex items-center justify-center text-xl font-bold text-text">−</button>
              <span className="w-6 text-center font-bold text-text">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-9 h-9 flex items-center justify-center text-xl font-bold text-text">+</button>
            </div>
          )}
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:opacity-70"
          >
            {outOfStock ? t('out_of_stock') : `${t('add_to_cart')} • R$ ${(Number(product.price) * quantity).toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add mini-app/src/pages/Catalog.tsx mini-app/src/pages/ProductDetail.tsx
git commit -m "feat: apply dark theme to Catalog and ProductDetail pages"
```

---

## Task 8: Pages — Cart + Orders

**Files:**
- Modify: `mini-app/src/pages/Cart.tsx`
- Modify: `mini-app/src/pages/Orders.tsx`

- [ ] **Step 1: Replace Cart.tsx**

```tsx
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useCheckout } from '@/hooks/useOrders'
import { useAuthStore } from '@/store/authStore'
import { t } from '@/hooks/useTranslation'

export default function Cart() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, total } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const checkout = useCheckout()

  async function handleCheckout() {
    if (!user?.selectedCityId || items.length === 0) return
    try {
      const order = await checkout.mutateAsync({
        cityId: user.selectedCityId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      navigate(`/orders/${order.id}/confirm`, { replace: true })
    } catch {
      // checkout.isError becomes true; error message rendered below
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <p className="text-5xl mb-4">🛒</p>
        <p className="text-muted text-center">{t('cart_empty')}</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-semibold">
          {t('view_products')}
        </button>
      </div>
    )
  }

  return (
    <div className="pb-36 bg-bg min-h-screen">
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="text-secondary text-sm mb-4 block">← {t('continue_shopping')}</button>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 bg-surface p-3 rounded-xl">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl flex-none" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-text leading-tight line-clamp-2">{item.name}</p>
                <p className="text-secondary font-bold mt-1">R$ {item.price.toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-center gap-1 flex-none">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-7 h-7 bg-surface-2 rounded-full flex items-center justify-center font-bold text-text">−</button>
                  <span className="w-4 text-center text-sm font-bold text-text">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-7 h-7 bg-surface-2 rounded-full flex items-center justify-center font-bold text-text">+</button>
                </div>
                <button onClick={() => removeItem(item.productId)} className="text-xs text-muted">{t('remove')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted">{t('total')}</span>
          <span className="text-xl font-bold text-secondary">R$ {total().toFixed(2)}</span>
        </div>
        {checkout.isError && (
          <p className="text-error text-sm text-center mb-2">{t('checkout_error')}</p>
        )}
        <button
          onClick={handleCheckout}
          disabled={checkout.isPending}
          className="w-full py-4 bg-primary text-white rounded-xl font-semibold disabled:opacity-50"
        >
          {checkout.isPending ? t('sending_order') : t('confirm_order')}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace Orders.tsx**

```tsx
import { useNavigate } from 'react-router-dom'
import { useOrders } from '@/hooks/useOrders'
import StatusBadge from '@/components/StatusBadge'
import { t } from '@/hooks/useTranslation'

export default function Orders() {
  const navigate = useNavigate()
  const { data: orders, isLoading } = useOrders()
  return (
    <div className="p-4 bg-bg min-h-screen">
      <h1 className="text-xl font-bold text-text mb-6">{t('my_orders')}</h1>
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-surface rounded-xl animate-pulse" />)}
        </div>
      )}
      {orders?.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p className="text-4xl mb-3">📋</p>
          <p>{t('no_orders')}</p>
        </div>
      )}
      <div className="space-y-3">
        {orders?.map((order) => (
          <button key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="w-full text-left bg-surface border border-border p-4 rounded-xl">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-sm text-text">{t('order')} #{order.id.slice(-6).toUpperCase()}</p>
                <p className="text-xs text-muted mt-0.5">{order.city.name}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">{order.items.length} {order.items.length === 1 ? t('item') : t('items')}</p>
              <p className="font-bold text-secondary">R$ {Number(order.totalAmount).toFixed(2)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add mini-app/src/pages/Cart.tsx mini-app/src/pages/Orders.tsx
git commit -m "feat: apply dark theme to Cart and Orders pages"
```

---

## Task 9: Pages — OrderDetail, OrderConfirm, CitySelect, AuthGate

**Files:**
- Modify: `mini-app/src/pages/OrderDetail.tsx`
- Modify: `mini-app/src/pages/OrderConfirm.tsx`
- Modify: `mini-app/src/pages/CitySelect.tsx`
- Modify: `mini-app/src/pages/AuthGate.tsx`

- [ ] **Step 1: Replace OrderDetail.tsx**

```tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useOrder } from '@/hooks/useOrders'
import StatusBadge from '@/components/StatusBadge'
import { t } from '@/hooks/useTranslation'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading } = useOrder(id!)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!order) return null

  return (
    <div className="p-4 bg-bg min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-secondary">{t('back')}</button>
        <h1 className="text-xl font-bold text-text">{t('order_details')}</h1>
      </div>
      <div className="bg-surface rounded-2xl p-4 mb-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">{t('order')}</span>
          <span className="font-mono text-sm text-text">#{order.id.slice(-6).toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">{t('status')}</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">{t('city')}</span>
          <span className="text-sm text-text">{order.city.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">{t('date')}</span>
          <span className="text-sm text-text">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      <div className="mb-4 bg-surface rounded-2xl overflow-hidden">
        {order.items.map((item, i) => (
          <div
            key={item.id}
            className={`flex justify-between items-center p-4 ${i < order.items.length - 1 ? 'border-b border-border' : ''}`}
          >
            <div>
              <p className="text-sm font-medium text-text">{item.productNameSnapshot}</p>
              <p className="text-xs text-muted">{item.quantity}x R$ {Number(item.unitPriceSnapshot).toFixed(2)}</p>
            </div>
            <p className="font-bold text-sm text-text">R$ {Number(item.lineTotal).toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center bg-surface p-4 rounded-2xl">
        <span className="font-semibold text-muted">{t('total')}</span>
        <span className="text-xl font-bold text-secondary">R$ {Number(order.totalAmount).toFixed(2)}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace OrderConfirm.tsx**

```tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useOrder } from '@/hooks/useOrders'
import { t } from '@/hooks/useTranslation'

export default function OrderConfirm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order } = useOrder(id ?? '')
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-4xl text-white font-bold mb-6"
        style={{ background: 'radial-gradient(circle, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, transparent))' }}
      >
        ✓
      </div>
      <h1 className="text-2xl font-bold text-text mb-2">{t('order_received')}</h1>
      <p className="text-muted mb-1">{t('order_success_desc')}</p>
      {order && (
        <p className="text-secondary font-bold text-lg mb-8">
          {t('total')}: R$ {Number(order.totalAmount).toFixed(2)}
        </p>
      )}
      <div className="space-y-3 w-full max-w-xs">
        <button onClick={() => navigate('/orders')} className="w-full py-3 bg-primary text-white rounded-xl font-semibold">
          {t('view_my_orders')}
        </button>
        <button onClick={() => navigate('/', { replace: true })} className="w-full py-3 bg-surface-2 text-text rounded-xl font-medium">
          {t('continue_shopping')}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace CitySelect.tsx**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCities } from '@/hooks/useCities'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { t } from '@/hooks/useTranslation'

export default function CitySelect() {
  const { data: cities, isLoading } = useCities()
  const updateUser = useAuthStore((s) => s.updateUser)
  const navigate = useNavigate()
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [error, setError] = useState(false)

  async function selectCity(cityId: string) {
    setSelectingId(cityId)
    setError(false)
    try {
      await api.patch('/users/me/city', { cityId })
      updateUser({ selectedCityId: cityId })
      navigate('/', { replace: true })
    } catch {
      setError(true)
    } finally {
      setSelectingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <h1 className="text-2xl font-bold text-text mb-2">{t('select_city')}</h1>
      <p className="text-muted text-sm mb-6">{t('select_city_desc')}</p>

      {error && <p className="text-error text-sm mb-4">{t('city_select_error')}</p>}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-surface rounded-xl animate-pulse" />)}
        </div>
      )}

      <div className="space-y-3">
        {cities?.map((city) => (
          <button
            key={city.id}
            onClick={() => selectCity(city.id)}
            disabled={selectingId !== null}
            className="w-full text-left px-4 py-4 bg-surface border border-border rounded-xl font-medium text-text active:opacity-60 transition-all disabled:opacity-50 hover:border-primary focus:border-primary"
          >
            <span className="flex items-center justify-between">
              {city.name}
              {selectingId === city.id && (
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Replace AuthGate.tsx**

```tsx
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { t } from '@/hooks/useTranslation'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  const { login, isLoading, isError } = useAuth()

  useEffect(() => { if (!token) login() }, [token, login])

  if (!token) {
    if (isError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-bg">
          <div className="text-center p-6">
            <p className="text-error mb-4">{t('auth_error')}</p>
            <button
              onClick={() => login()}
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          {isLoading && <p className="text-muted text-sm">{t('authenticating')}</p>}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
```

- [ ] **Step 5: Commit**

```bash
git add mini-app/src/pages/OrderDetail.tsx mini-app/src/pages/OrderConfirm.tsx mini-app/src/pages/CitySelect.tsx mini-app/src/pages/AuthGate.tsx
git commit -m "feat: apply dark theme to OrderDetail, OrderConfirm, CitySelect, AuthGate"
```

---

## Task 10: Admin Panel — Color Pickers

**Files:**
- Modify: `admin/src/hooks/useAdminSettings.ts`
- Modify: `admin/src/pages/settings/StoreSettings.tsx`

- [ ] **Step 1: Update useAdminSettings.ts — add color fields to interface**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface StoreSetting {
  id: string
  storeName: string
  logoUrl?: string
  supportTelegramUrl?: string
  adminTelegramId?: string
  defaultLanguage: string
  welcomeText?: string
  primaryColor: string
  secondaryColor: string
}

export function useAdminSettings() {
  return useQuery<StoreSetting>({ queryKey: ['admin', 'settings'], queryFn: async () => (await api.get('/admin/settings')).data })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<StoreSetting>) => api.patch('/admin/settings', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  })
}
```

- [ ] **Step 2: Update StoreSettings.tsx — add color picker inputs**

The component needs `watch` and `setValue` from `useForm` to sync the `type="color"` picker with the `type="text"` input. Both read from/write to the same field name.

```tsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAdminSettings, useUpdateSettings } from '@/hooks/useAdminSettings'
import type { StoreSetting } from '@/hooks/useAdminSettings'

type FormData = Omit<StoreSetting, 'id'>

export default function StoreSettings() {
  const { data: settings } = useAdminSettings()
  const update = useUpdateSettings()
  const [saved, setSaved] = useState(false)
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>()

  useEffect(() => { if (settings) reset(settings) }, [settings, reset])

  function onSubmit(data: FormData) {
    update.mutate(data, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
    })
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Configurações da loja</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border rounded-2xl p-6 space-y-4">
        <div><label className="block text-sm font-medium mb-1">Nome da loja</label><input {...register('storeName')} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium mb-1">URL do logo</label><input {...register('logoUrl')} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium mb-1">Link do suporte Telegram</label><input {...register('supportTelegramUrl')} placeholder="https://t.me/suporte" className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div>
          <label className="block text-sm font-medium mb-1">Telegram ID do admin</label>
          <input {...register('adminTelegramId')} placeholder="Ex: 123456789" className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="text-xs text-gray-400 mt-1">ID numérico do Telegram que receberá notificações de novos pedidos</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Idioma padrão</label>
          <select {...register('defaultLanguage')} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="pt">Português</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium mb-1">Texto de boas-vindas (bot)</label><textarea {...register('welcomeText')} rows={3} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
        <div>
          <label className="block text-sm font-medium mb-1">Cor primária</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={watch('primaryColor') || '#7c3aed'}
              onChange={(e) => setValue('primaryColor', e.target.value)}
              className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              {...register('primaryColor')}
              placeholder="#7c3aed"
              className="flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Cor dos botões, destaques e preços no Mini App</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cor secundária</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={watch('secondaryColor') || '#a78bfa'}
              onChange={(e) => setValue('secondaryColor', e.target.value)}
              className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              {...register('secondaryColor')}
              placeholder="#a78bfa"
              className="flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Cor de texto de destaque e preços</p>
        </div>
        <button type="submit" disabled={update.isPending} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
          {update.isPending ? 'Salvando...' : 'Salvar configurações'}
        </button>
        {saved && <p className="text-green-600 text-sm text-center">Salvo com sucesso!</p>}
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript in admin**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/.worktrees/telegram-store/admin
npx tsc --noEmit 2>&1 | grep -E "error|Error"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add admin/src/hooks/useAdminSettings.ts admin/src/pages/settings/StoreSettings.tsx
git commit -m "feat: add color picker inputs to admin settings panel"
```

---

## Task 11: Build Verification

**Files:** None — verification only.

- [ ] **Step 1: Build mini-app**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/.worktrees/telegram-store/mini-app
npm run build 2>&1
```

Expected: `✓ built in` with no TypeScript errors. Warnings about unused variables are acceptable; errors are not.

- [ ] **Step 2: Build admin**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/.worktrees/telegram-store/admin
npm run build 2>&1
```

Expected: no errors.

- [ ] **Step 3: If build errors, fix them**

Common issues to check:
- `bg-primary-soft` class not found → replace with `bg-[var(--color-primary-soft)]`
- Missing import for `useEffect` in `useStoreSettings.ts` → add `import { useEffect } from 'react'`
- TypeScript error on `query.data` in `useStoreSettings` → the hook uses `query.data?.primaryColor`

- [ ] **Step 4: Commit fixes if any**

```bash
git add -p
git commit -m "fix: resolve build errors after dark theme implementation"
```

- [ ] **Step 5: Final commit confirming clean build**

```bash
git log --oneline -10
```

Expected: 10 commits visible, each corresponding to a task above.
