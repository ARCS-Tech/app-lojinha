# Mini App Dark Theme Redesign

## Goal

Redesign the Mini App UI with a premium dark mode theme targeting alcoholic beverage stores, with a dynamic color system where the admin sets primary and secondary brand colors via the settings panel. Colors update without any rebuild or deploy.

## Architecture

**CSS Custom Properties injected at runtime.** The Mini App defines a complete dark theme in `index.css` using CSS variables. On boot, `useSettings` fetches `GET /settings`, reads `primaryColor` and `secondaryColor`, and writes them to `document.documentElement.style` via `setProperty`. All components consume `var(--color-primary)` etc. through Tailwind arbitrary value classes.

The Telegram theme variables (`--tg-theme-*`) are no longer used for visual styling. The app forces its own dark palette regardless of the user's Telegram theme setting.

## Color System

### Fixed dark palette (defined in `index.css`)

| Variable | Value | Role |
|---|---|---|
| `--color-bg` | `#0d0d12` | Page background |
| `--color-surface` | `#16161e` | Cards, list items |
| `--color-surface-2` | `#1e1e28` | Inputs, secondary buttons |
| `--color-border` | `#2a2a38` | Subtle borders |
| `--color-text` | `#f0f0f5` | Primary text |
| `--color-muted` | `#6b6b80` | Secondary text / hints |
| `--color-error` | `#f87171` | Errors, out-of-stock |
| `--color-success` | `#4ade80` | Confirmed status |

### Dynamic brand colors (injected at runtime from `/settings`)

| Variable | Default | Role |
|---|---|---|
| `--color-primary` | `#7c3aed` | CTAs, active states, FAB cart, price accent |
| `--color-primary-soft` | `rgba(124,58,237,0.15)` | Badge backgrounds, hover surfaces |
| `--color-secondary` | `#a78bfa` | Price text, highlighted values |

`--color-primary-soft` is computed from `--color-primary` by the `useSettings` hook using a hex-to-rgba helper — it is not stored in the database.

## Component Specifications

### `index.css`

- Remove all `tg-*` theme variable definitions
- Define the full fixed dark palette above under `@theme {}`
- Add `color-scheme: dark` to `body`
- Keep `--color-primary` and `--color-secondary` with their defaults (overridden at runtime)

### `Header`

- Background: `var(--color-bg)` with `backdrop-blur-md` + bottom border `var(--color-border)`
- Store name: `var(--color-text)` bold
- Language pills: inactive = `var(--color-surface-2)` text `var(--color-muted)`; active = `var(--color-primary)` text white

### `CategoryBar`

- Pills background: `var(--color-surface-2)` text `var(--color-muted)`
- Active pill: `var(--color-primary)` text white
- No changes to scroll behavior

### `ProductCard`

- Card background: `var(--color-surface)` with `rounded-2xl`
- Image occupies ~65% of card height (`aspect-[3/4]`)
- Bottom section has a vertical gradient overlay (`from-transparent to-black/80`) over the image, with product name and price rendered on top of it — premium delivery app style
- Price: `var(--color-secondary)` bold
- Out-of-stock badge: background `var(--color-error)/15` text `var(--color-error)`, positioned top-left
- Active state: `opacity-80` on press (keep existing `active:opacity-70` pattern)

### `Catalog` page

- Background: `var(--color-bg)`
- Search input: background `var(--color-surface-2)`, border `var(--color-border)` on focus changes to `var(--color-primary)`
- Skeleton: `var(--color-surface)` pulse
- FAB cart: background `var(--color-primary)`, box-shadow `0 4px 24px var(--color-primary)/40` (colored glow)
- FAB support: background `var(--color-surface-2)`
- Cart badge: background `var(--color-error)`

### `ProductDetail` page

- Back button: background `var(--color-surface)/80` with `backdrop-blur`
- Media gallery: background `var(--color-surface)`, active thumbnail border `var(--color-primary)`
- Category badge: background `var(--color-primary-soft)` text `var(--color-secondary)`
- Price: `var(--color-secondary)` bold, large
- Description: `var(--color-muted)`
- Bottom bar: background `var(--color-surface)` top border `var(--color-border)`
- Quantity controls: circular buttons `var(--color-surface-2)`, count text `var(--color-text)`
- CTA button: background `var(--color-primary)` text white, full width `rounded-xl`

### `Cart` page

- Item cards: background `var(--color-surface)`, `rounded-xl`, no explicit border
- Thumbnails: `rounded-xl`
- Quantity controls: same pattern as ProductDetail
- Remove button: `var(--color-muted)` text (less aggressive than red)
- Bottom bar: background `var(--color-surface)` top border `var(--color-border)`
- Total label: `var(--color-muted)`, total value: `var(--color-secondary)` bold
- Checkout button: `var(--color-primary)` text white

### `Orders` list page

- Order cards: background `var(--color-surface)` border `var(--color-border)` `rounded-xl`
- Order ID: `var(--color-muted)` monospace font
- City: `var(--color-muted)`
- Item count: `var(--color-muted)`
- Total: `var(--color-secondary)` bold
- Status badge: dark variant (see StatusBadge below)

### `OrderDetail` page

- Metadata section: background `var(--color-surface)` `rounded-2xl`
- Items: simple rows separated by `var(--color-border)` divider lines (no card per item)
- Total row: `var(--color-secondary)` bold, slightly larger text
- Loading spinner border: `var(--color-primary)`

### `OrderConfirm` page

- Full-screen background: `var(--color-bg)`
- Success icon: circle with radial gradient from `var(--color-primary)` to `var(--color-primary)/60`, white checkmark inside
- Title: `var(--color-text)` bold
- Description: `var(--color-muted)`
- Total: `var(--color-secondary)` bold
- Primary button: `var(--color-primary)` text white
- Secondary button: `var(--color-surface-2)` text `var(--color-text)`

### `CitySelect` page

- City buttons: background `var(--color-surface)` border `var(--color-border)`, on hover/focus border changes to `var(--color-primary)`
- Selecting state: spinner `var(--color-primary)` inline
- Error text: `var(--color-error)`

### `AuthGate`

- Background: `var(--color-bg)`
- Spinner border: `var(--color-primary)`
- Retry button: `var(--color-primary)` text white

### `StatusBadge` (dark variants)

| Status | Background | Text |
|---|---|---|
| `submitted` | `amber-500/15` | `amber-400` |
| `in_review` | `blue-500/15` | `blue-400` |
| `confirmed` | `green-500/15` | `green-400` |
| `cancelled` | `red-500/15` | `red-400` |
| fallback | `var(--color-surface-2)` | `var(--color-muted)` |

## Dynamic Color Flow

### `useSettings` hook changes

After the existing query resolves:

```ts
function applyTheme(primaryColor: string, secondaryColor: string) {
  const root = document.documentElement
  root.style.setProperty('--color-primary', primaryColor)
  root.style.setProperty('--color-secondary', secondaryColor)
  // Compute primary-soft: hex to rgba with 0.15 opacity
  const r = parseInt(primaryColor.slice(1, 3), 16)
  const g = parseInt(primaryColor.slice(3, 5), 16)
  const b = parseInt(primaryColor.slice(5, 7), 16)
  root.style.setProperty('--color-primary-soft', `rgba(${r},${g},${b},0.15)`)
}
```

Called in `onSuccess` of the settings query. If settings are not yet loaded, the CSS defaults in `index.css` apply.

### `storeSetting` schema additions

```prisma
model StoreSetting {
  // ... existing fields ...
  primaryColor   String  @default("#7c3aed")
  secondaryColor String  @default("#a78bfa")
}
```

Migration: `20260423000000_add_theme_colors`

### Admin panel additions

In `useAdminSettings.ts`, add to `StoreSetting` interface:
```ts
primaryColor: string
secondaryColor: string
```

In `StoreSettings.tsx`, add two color picker inputs after the existing fields:

```tsx
<div>
  <label>Cor primária</label>
  <div className="flex items-center gap-3">
    <input type="color" {...register('primaryColor')} className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer" />
    <input type="text" {...register('primaryColor')} className="flex-1 px-4 py-2.5 border rounded-xl text-sm ..." placeholder="#7c3aed" />
  </div>
  <p className="text-xs text-gray-400 mt-1">Cor dos botões, destaques e preços no Mini App</p>
</div>
<div>
  <label>Cor secundária</label>
  <div className="flex items-center gap-3">
    <input type="color" {...register('secondaryColor')} className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer" />
    <input type="text" {...register('secondaryColor')} className="flex-1 px-4 py-2.5 border rounded-xl text-sm ..." placeholder="#a78bfa" />
  </div>
  <p className="text-xs text-gray-400 mt-1">Cor de texto de destaque e preços</p>
</div>
```

The color picker and text input are synced via `react-hook-form` sharing the same field name — changing either updates the other.

## File Change Summary

| File | Change |
|---|---|
| `backend/prisma/schema.prisma` | Add `primaryColor`, `secondaryColor` to `StoreSetting` |
| `backend/prisma/migrations/20260423000000_add_theme_colors/migration.sql` | New migration |
| `mini-app/src/index.css` | Full dark theme, remove tg-* vars |
| `mini-app/src/hooks/useSettings.ts` | Call `applyTheme()` on success |
| `mini-app/src/pages/Catalog.tsx` | New classes |
| `mini-app/src/pages/ProductDetail.tsx` | New classes |
| `mini-app/src/pages/Cart.tsx` | New classes |
| `mini-app/src/pages/Orders.tsx` | New classes |
| `mini-app/src/pages/OrderDetail.tsx` | New classes |
| `mini-app/src/pages/OrderConfirm.tsx` | New classes |
| `mini-app/src/pages/CitySelect.tsx` | New classes |
| `mini-app/src/pages/AuthGate.tsx` | New classes |
| `mini-app/src/components/Header.tsx` | New classes |
| `mini-app/src/components/ProductCard.tsx` | New layout + classes |
| `mini-app/src/components/CategoryBar.tsx` | New classes |
| `mini-app/src/components/CartFAB.tsx` | New classes + glow shadow |
| `mini-app/src/components/SupportFAB.tsx` | New classes |
| `mini-app/src/components/StatusBadge.tsx` | Dark variant classes |
| `mini-app/src/components/MediaGallery.tsx` | New classes |
| `admin/src/hooks/useAdminSettings.ts` | Add fields to interface |
| `admin/src/pages/settings/StoreSettings.tsx` | Add color picker inputs |
