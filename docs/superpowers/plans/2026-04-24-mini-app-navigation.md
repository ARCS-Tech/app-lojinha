# Mini-App Navigation & Auth Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed bottom navigation bar (Catálogo · Carrinho · Pedidos) to the Telegram mini-app, fix the Orders page back navigation, and make auth always re-validate via initData on app open.

**Architecture:** A new `BottomNav` component is added to `AppLayout` in `App.tsx`, replacing the `CartFAB` (removed from `Catalog.tsx`). `SupportFAB` is moved to `AppLayout` so it appears on all pages. `AuthGate` is updated to always call `login()` on mount regardless of cached token.

**Tech Stack:** React 18, React Router v6, Zustand, Tailwind CSS v4, TypeScript

---

## File Map

| File | Action |
|------|--------|
| `mini-app/src/index.css` | Add `--bottom-nav-height: 64px` CSS variable |
| `mini-app/src/components/BottomNav.tsx` | Create — 3-tab fixed bottom nav |
| `mini-app/src/App.tsx` | Add `BottomNav` + `SupportFAB` to `AppLayout`; add padding wrapper; hide nav on `/city` |
| `mini-app/src/pages/Catalog.tsx` | Remove `CartFAB` and `SupportFAB` imports and JSX |
| `mini-app/src/components/SupportFAB.tsx` | Adjust `bottom` from `bottom-6` to use CSS variable |
| `mini-app/src/pages/Orders.tsx` | Add "← Catálogo" button at top |
| `mini-app/src/pages/AuthGate.tsx` | Remove `if (!token)` guard so login always fires on mount |
| `mini-app/src/components/CartFAB.tsx` | Delete |

---

## Task 1: Add CSS variable for bottom nav height

**Files:**
- Modify: `mini-app/src/index.css`

- [ ] **Step 1: Add the variable to `index.css`**

Add after the closing `}` of `@theme { ... }`:

```css
:root {
  --bottom-nav-height: 64px;
}
```

Full file after edit:

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

:root {
  --bottom-nav-height: 64px;
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

- [ ] **Step 2: Commit**

```bash
cd mini-app
git add src/index.css
git commit -m "style: add --bottom-nav-height CSS variable"
```

---

## Task 2: Create BottomNav component

**Files:**
- Create: `mini-app/src/components/BottomNav.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useLocation, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'

const tabs = [
  { path: '/', label: 'Catálogo', icon: '🛍️' },
  { path: '/cart', label: 'Carrinho', icon: '🛒' },
  { path: '/orders', label: 'Pedidos', icon: '📦' },
] as const

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const cartCount = useCartStore((s) => s.count())

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 flex"
      style={{ height: 'var(--bottom-nav-height)' }}
    >
      {tabs.map((tab) => {
        const isActive = tab.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(tab.path)
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative active:opacity-70"
            style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            {tab.path === '/cart' && cartCount > 0 && (
              <span
                className="absolute top-2 right-1/4 bg-error text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center"
                style={{ fontSize: '10px' }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd mini-app
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: add BottomNav component with cart badge"
```

---

## Task 3: Update App.tsx — integrate BottomNav and SupportFAB into layout

**Files:**
- Modify: `mini-app/src/App.tsx`

The `AppLayout` component needs to:
1. Include `BottomNav` (hidden on `/city` route)
2. Include `SupportFAB` (moved here from `Catalog.tsx` so it appears on all pages)
3. Wrap the route children in a div with `padding-bottom` so content isn't hidden behind the nav bar

- [ ] **Step 1: Replace `App.tsx` with the updated version**

```tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AuthGate from '@/pages/AuthGate'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import SupportFAB from '@/components/SupportFAB'
import CitySelect from '@/pages/CitySelect'
import Catalog from '@/pages/Catalog'
import ProductDetail from '@/pages/ProductDetail'
import Cart from '@/pages/Cart'
import OrderConfirm from '@/pages/OrderConfirm'
import Orders from '@/pages/Orders'
import OrderDetail from '@/pages/OrderDetail'
import { useAuthStore } from '@/store/authStore'

function RequireCity({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user?.selectedCityId) return <Navigate to="/city" replace />
  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const showNav = location.pathname !== '/city'
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1" style={showNav ? { paddingBottom: 'var(--bottom-nav-height)' } : undefined}>
        {children}
      </div>
      {showNav && <BottomNav />}
      {showNav && <SupportFAB />}
    </div>
  )
}

export default function App() {
  return (
    <AuthGate>
      <Routes>
        <Route path="/city" element={<AppLayout><CitySelect /></AppLayout>} />
        <Route path="/" element={<RequireCity><AppLayout><Catalog /></AppLayout></RequireCity>} />
        <Route path="/products/:id" element={<RequireCity><AppLayout><ProductDetail /></AppLayout></RequireCity>} />
        <Route path="/cart" element={<RequireCity><AppLayout><Cart /></AppLayout></RequireCity>} />
        <Route path="/orders" element={<RequireCity><AppLayout><Orders /></AppLayout></RequireCity>} />
        <Route path="/orders/:id" element={<RequireCity><AppLayout><OrderDetail /></AppLayout></RequireCity>} />
        <Route path="/orders/:id/confirm" element={<RequireCity><AppLayout><OrderConfirm /></AppLayout></RequireCity>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGate>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd mini-app
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate BottomNav and SupportFAB into AppLayout"
```

---

## Task 4: Remove CartFAB and SupportFAB from Catalog.tsx

**Files:**
- Modify: `mini-app/src/pages/Catalog.tsx`

Both FABs are now rendered by `AppLayout` in `App.tsx`. Remove them from `Catalog.tsx` to avoid duplication.

- [ ] **Step 1: Remove imports and JSX from Catalog.tsx**

Open `mini-app/src/pages/Catalog.tsx`. Remove these two import lines:
```ts
import CartFAB from '@/components/CartFAB'
import SupportFAB from '@/components/SupportFAB'
```

And remove these two JSX lines (near the bottom of the return statement):
```tsx
<CartFAB />
<SupportFAB />
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd mini-app
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Catalog.tsx
git commit -m "refactor: remove CartFAB and SupportFAB from Catalog (moved to AppLayout)"
```

---

## Task 5: Adjust SupportFAB bottom position

**Files:**
- Modify: `mini-app/src/components/SupportFAB.tsx`

The SupportFAB was at `bottom-6` (24px). It now needs to sit above the bottom nav bar.

- [ ] **Step 1: Replace the fixed position classes**

Replace the full file content:

```tsx
import { tg } from '@/lib/telegram'
import { useStoreSettings } from '@/hooks/useStoreSettings'

export default function SupportFAB() {
  const { data: settings } = useStoreSettings()
  if (!settings?.supportTelegramUrl) return null
  return (
    <button
      onClick={() => tg()?.openTelegramLink(settings.supportTelegramUrl!)}
      className="fixed left-6 w-14 h-14 bg-surface-2 rounded-full shadow-lg flex items-center justify-center text-2xl z-50 active:opacity-70"
      style={{ bottom: 'calc(var(--bottom-nav-height) + 16px)' }}
    >
      💬
    </button>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd mini-app
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SupportFAB.tsx
git commit -m "fix: position SupportFAB above bottom nav bar"
```

---

## Task 6: Delete CartFAB.tsx

**Files:**
- Delete: `mini-app/src/components/CartFAB.tsx`

- [ ] **Step 1: Delete the file**

```bash
cd mini-app
rm src/components/CartFAB.tsx
```

- [ ] **Step 2: Verify TypeScript (no dangling imports)**

```bash
npx tsc --noEmit
```

Expected: no errors. If there's an import error, search for remaining references:
```bash
grep -r "CartFAB" src/
```
and remove them.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove CartFAB (replaced by BottomNav cart tab)"
```

---

## Task 7: Add back button to Orders page

**Files:**
- Modify: `mini-app/src/pages/Orders.tsx`

- [ ] **Step 1: Add "← Catálogo" button at the top**

Replace the full file:

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
      <button onClick={() => navigate('/')} className="text-secondary text-sm mb-4 flex items-center gap-1">
        ← {t('catalog')}
      </button>
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

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Orders.tsx
git commit -m "feat: add back-to-catalog button on Orders page"
```

---

## Task 8: Fix AuthGate — always re-authenticate on mount

**Files:**
- Modify: `mini-app/src/pages/AuthGate.tsx`

**Current problem:** The `useEffect` only calls `login()` when there is no cached token. If the token expires, the app silently fails on all API calls.

**Fix:** Remove the `if (!token)` guard so `login()` always runs on mount. The cached token continues to be used for API requests while re-auth is in progress (set by `onRehydrateStorage` in `authStore.ts`).

- [ ] **Step 1: Replace AuthGate.tsx**

```tsx
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { t } from '@/hooks/useTranslation'

function getDebugInfo() {
  const tgExists = !!window.Telegram?.WebApp
  const initData = window.Telegram?.WebApp?.initData ?? 'N/A'
  const initDataLen = initData.length
  const apiUrl = import.meta.env.VITE_API_URL ?? 'NOT SET'
  return { tgExists, initDataLen, apiUrl, initDataPreview: initData.slice(0, 40) || 'EMPTY' }
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  const { login, isLoading, isError, error } = useAuth()

  // Always re-authenticate on mount using Telegram initData.
  // The cached token (if any) is used for API requests while this runs.
  useEffect(() => { login() }, [])

  // If we have a cached token, render children immediately (re-auth in background).
  // If we have no cached token, wait for auth to complete.
  if (!token) {
    if (isError) {
      const dbg = getDebugInfo()
      return (
        <div className="flex items-center justify-center min-h-screen bg-bg">
          <div className="text-center p-6">
            <p className="text-error mb-4">{t('auth_error')}</p>
            <p className="text-muted text-xs mb-2 break-all">{String(error)}</p>
            <div className="text-left text-xs text-muted bg-surface-2 rounded p-3 mb-4 space-y-1">
              <p>TG SDK: {dbg.tgExists ? 'OK' : 'MISSING'}</p>
              <p>initData: {dbg.initDataPreview}</p>
              <p>initData len: {dbg.initDataLen}</p>
              <p>API: {dbg.apiUrl}</p>
            </div>
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

- [ ] **Step 2: Verify TypeScript**

```bash
cd mini-app
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AuthGate.tsx
git commit -m "fix: always re-authenticate via initData on app mount"
```

---

## Task 9: Build verification

- [ ] **Step 1: Run the full build**

```bash
cd mini-app
npm run build
```

Expected: build completes with no errors. Warnings about bundle size are acceptable.

- [ ] **Step 2: Start dev server and verify visually**

```bash
npm run dev
```

Open the local URL. Verify:
- [ ] Bottom nav shows 3 tabs: Catálogo, Carrinho, Pedidos
- [ ] Active tab is highlighted in purple (`--color-primary`)
- [ ] Add an item to cart — Carrinho tab shows badge count
- [ ] Navigate to Pedidos — bottom nav stays visible, "← Catálogo" button visible at top
- [ ] Tap "← Catálogo" — returns to catalog
- [ ] Navigate to `/city` — bottom nav is hidden
- [ ] SupportFAB (if configured) appears above the bottom nav bar, not behind it
- [ ] CartFAB is gone — no floating cart button

- [ ] **Step 3: Commit if any small fixes were needed during visual verification**

```bash
git add -A
git commit -m "fix: visual corrections from dev verification"
```
