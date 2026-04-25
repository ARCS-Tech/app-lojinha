# Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based admin panel for managing products (with stock), orders (with status transitions), cities, categories, and store settings (including adminTelegramId).

**Architecture:** React 18 + Vite + TypeScript + Tailwind CSS. API calls use `Authorization: Bearer <ADMIN_SECRET>`. TanStack Query for server state, React Hook Form for forms. Auth via static token stored in localStorage.

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind CSS, TanStack Query v5, React Hook Form, React Router v6, Axios

---

## File Structure

```
admin/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── queryClient.ts
│   ├── store/
│   │   └── adminStore.ts
│   ├── hooks/
│   │   ├── useAdminProducts.ts
│   │   ├── useAdminOrders.ts
│   │   ├── useAdminCities.ts
│   │   ├── useAdminCategories.ts
│   │   └── useAdminSettings.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── products/
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   └── ProductMediaManager.tsx
│   │   ├── orders/
│   │   │   ├── OrderList.tsx
│   │   │   └── OrderDetail.tsx
│   │   ├── cities/
│   │   │   ├── CityList.tsx
│   │   │   └── CityForm.tsx
│   │   ├── categories/
│   │   │   ├── CategoryList.tsx
│   │   │   └── CategoryForm.tsx
│   │   └── settings/
│   │       └── StoreSettings.tsx
│   └── components/
│       ├── Layout.tsx
│       ├── ProtectedRoute.tsx
│       └── StatusBadge.tsx
```

---

## Task 1: Project Bootstrap

- [ ] **Step 1: Scaffold project**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha
npm create vite@latest admin -- --template react-ts
cd admin && npm install
npm install @tanstack/react-query axios zustand react-router-dom react-hook-form
npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
```

- [ ] **Step 2: Configure tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config
```

- [ ] **Step 3: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Update vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 5174 },
})
```

- [ ] **Step 5: Create .env.example**

```
VITE_API_URL=http://localhost:3000
```

- [ ] **Step 6: Commit**

```bash
git add admin/
git commit -m "feat: scaffold admin panel"
```

---

## Task 2: API Client + Admin Store + Query Client

- [ ] **Step 1: Create src/lib/api.ts**

```typescript
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
export const api = axios.create({ baseURL: BASE_URL })

export function setAdminToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
export function clearAdminToken() {
  delete api.defaults.headers.common['Authorization']
}
```

- [ ] **Step 2: Create src/lib/queryClient.ts**

```typescript
import { QueryClient } from '@tanstack/react-query'
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 1 } },
})
```

- [ ] **Step 3: Create src/store/adminStore.ts**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAdminToken, clearAdminToken } from '@/lib/api'

interface AdminState {
  token: string | null
  setToken: (token: string) => void
  logout: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => { setAdminToken(token); set({ token }) },
      logout: () => { clearAdminToken(); set({ token: null }) },
    }),
    {
      name: 'admin-auth',
      onRehydrateStorage: () => (state) => { if (state?.token) setAdminToken(state.token) },
    }
  )
)
```

- [ ] **Step 4: Commit**

```bash
git add admin/src/lib/ admin/src/store/
git commit -m "feat: add admin API client and auth store"
```

---

## Task 3: Layout + Auth + Router

- [ ] **Step 1: Create src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter><App /></BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
```

- [ ] **Step 2: Create src/components/ProtectedRoute.tsx**

```typescript
import { Navigate } from 'react-router-dom'
import { useAdminStore } from '@/store/adminStore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAdminStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 3: Create src/components/Layout.tsx**

```typescript
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminStore } from '@/store/adminStore'

const navItems = [
  { to: '/products', label: '📦 Produtos' },
  { to: '/orders', label: '🧾 Pedidos' },
  { to: '/cities', label: '🏙️ Cidades' },
  { to: '/categories', label: '🗂️ Categorias' },
  { to: '/settings', label: '⚙️ Configurações' },
]

export default function Layout() {
  const logout = useAdminStore((s) => s.logout)
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="p-5 border-b"><h1 className="font-bold text-lg">Lojinha Admin</h1></div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  )
}
```

- [ ] **Step 4: Create src/pages/Login.tsx**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '@/store/adminStore'
import { api } from '@/lib/api'

export default function Login() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setStoreToken = useAdminStore((s) => s.setToken)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.get('/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      setStoreToken(token)
      navigate('/', { replace: true })
    } catch {
      setError('Token inválido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Admin</h1>
        <p className="text-gray-500 text-sm mb-6">Digite o token de acesso</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="Token de admin"
            className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading || !token}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create src/pages/Dashboard.tsx**

```typescript
import { useNavigate } from 'react-router-dom'

const cards = [
  { to: '/products', label: 'Produtos', icon: '📦', desc: 'Gerenciar catálogo' },
  { to: '/orders', label: 'Pedidos', icon: '🧾', desc: 'Ver e atualizar pedidos' },
  { to: '/cities', label: 'Cidades', icon: '🏙️', desc: 'Cidades disponíveis' },
  { to: '/categories', label: 'Categorias', icon: '🗂️', desc: 'Categorias de produtos' },
  { to: '/settings', label: 'Configurações', icon: '⚙️', desc: 'Dados da loja' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Painel</h1>
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        {cards.map((c) => (
          <button key={c.to} onClick={() => navigate(c.to)} className="text-left bg-white border rounded-2xl p-5 hover:shadow-md transition-shadow">
            <p className="text-3xl mb-2">{c.icon}</p>
            <p className="font-semibold">{c.label}</p>
            <p className="text-gray-400 text-sm">{c.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create src/App.tsx**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ProductList from '@/pages/products/ProductList'
import ProductForm from '@/pages/products/ProductForm'
import OrderList from '@/pages/orders/OrderList'
import OrderDetail from '@/pages/orders/OrderDetail'
import CityList from '@/pages/cities/CityList'
import CityForm from '@/pages/cities/CityForm'
import CategoryList from '@/pages/categories/CategoryList'
import CategoryForm from '@/pages/categories/CategoryForm'
import StoreSettings from '@/pages/settings/StoreSettings'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="cities" element={<CityList />} />
        <Route path="cities/new" element={<CityForm />} />
        <Route path="cities/:id/edit" element={<CityForm />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="categories/new" element={<CategoryForm />} />
        <Route path="categories/:id/edit" element={<CategoryForm />} />
        <Route path="settings" element={<StoreSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add admin/src/
git commit -m "feat: add admin layout, login, router and dashboard"
```

---

## Task 4: Admin Hooks

- [ ] **Step 1: Create src/hooks/useAdminProducts.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AdminProduct {
  id: string; name: string; slug: string; description?: string
  price: number; stock: number; isActive: boolean
  category: { id: string; name: string }
  media: Array<{ id: string; url: string; type: string; sortOrder: number }>
}

export function useAdminProducts() {
  return useQuery<AdminProduct[]>({ queryKey: ['admin', 'products'], queryFn: async () => (await api.get('/admin/products')).data })
}

export function useAdminProduct(id: string) {
  return useQuery<AdminProduct>({ queryKey: ['admin', 'products', id], queryFn: async () => (await api.get(`/admin/products/${id}`)).data, enabled: !!id })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AdminProduct & { media?: Array<{ type: string; url: string }> }>) => api.post('/admin/products', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AdminProduct>) => api.patch(`/admin/products/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useAddProductMedia(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { type: string; url: string; sortOrder?: number }) => api.post(`/admin/products/${productId}/media`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products', productId] }),
  })
}

export function useDeleteProductMedia(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (mediaId: string) => api.delete(`/admin/products/${productId}/media/${mediaId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products', productId] }),
  })
}
```

- [ ] **Step 2: Create src/hooks/useAdminOrders.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AdminOrder {
  id: string; status: string; totalAmount: number; createdAt: string; notes?: string
  city: { name: string }
  user: { firstName: string; username?: string; telegramId: string }
  items: Array<{ id: string; productNameSnapshot: string; unitPriceSnapshot: number; quantity: number; lineTotal: number }>
}

export function useAdminOrders(filters?: { status?: string; cityId?: string }) {
  return useQuery<AdminOrder[]>({ queryKey: ['admin', 'orders', filters], queryFn: async () => (await api.get('/admin/orders', { params: filters })).data })
}

export function useAdminOrder(id: string) {
  return useQuery<AdminOrder>({ queryKey: ['admin', 'orders', id], queryFn: async () => (await api.get(`/admin/orders/${id}`)).data, enabled: !!id })
}

export function useUpdateOrderStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: string) => api.patch(`/admin/orders/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'orders'] }),
  })
}
```

- [ ] **Step 3: Create src/hooks/useAdminCities.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AdminCity { id: string; name: string; slug: string; isActive: boolean; sortOrder: number }

export function useAdminCities() {
  return useQuery<AdminCity[]>({ queryKey: ['admin', 'cities'], queryFn: async () => (await api.get('/admin/cities')).data })
}

export function useCreateCity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; slug: string; sortOrder?: number }) => api.post('/admin/cities', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'cities'] }),
  })
}

export function useUpdateCity(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AdminCity>) => api.patch(`/admin/cities/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'cities'] }),
  })
}
```

- [ ] **Step 4: Create src/hooks/useAdminCategories.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AdminCategory { id: string; name: string; slug: string; isActive: boolean; sortOrder: number }

export function useAdminCategories() {
  return useQuery<AdminCategory[]>({ queryKey: ['admin', 'categories'], queryFn: async () => (await api.get('/admin/categories')).data })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; slug: string; sortOrder?: number }) => api.post('/admin/categories', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  })
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AdminCategory>) => api.patch(`/admin/categories/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  })
}
```

- [ ] **Step 5: Create src/hooks/useAdminSettings.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface StoreSetting {
  id: string; storeName: string; logoUrl?: string; supportTelegramUrl?: string
  adminTelegramId?: string; defaultLanguage: string; welcomeText?: string
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

- [ ] **Step 6: Commit**

```bash
git add admin/src/hooks/
git commit -m "feat: add admin hooks for all resources"
```

---

## Task 5: Products Pages

- [ ] **Step 1: Create src/components/StatusBadge.tsx**

```typescript
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Enviado', color: 'bg-yellow-100 text-yellow-700' },
  in_review: { label: 'Em análise', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, color: 'bg-gray-100 text-gray-500' }
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
}
```

- [ ] **Step 2: Create src/pages/products/ProductList.tsx**

```typescript
import { useNavigate } from 'react-router-dom'
import { useAdminProducts, useDeleteProduct } from '@/hooks/useAdminProducts'

export default function ProductList() {
  const navigate = useNavigate()
  const { data: products, isLoading } = useAdminProducts()
  const deleteProduct = useDeleteProduct()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <button onClick={() => navigate('/products/new')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          + Novo produto
        </button>
      </div>
      {isLoading && <p className="text-gray-400">Carregando...</p>}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Categoria</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Preço</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Estoque</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {products?.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.category.name}</td>
                <td className="px-4 py-3">R$ {Number(p.price).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={p.stock === 0 ? 'text-red-500 font-medium' : ''}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => navigate(`/products/${p.id}/edit`)} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => { if (confirm(`Desativar "${p.name}"?`)) deleteProduct.mutate(p.id) }} className="text-red-400 hover:underline">Desativar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/pages/products/ProductForm.tsx**

```typescript
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAdminProduct, useCreateProduct, useUpdateProduct } from '@/hooks/useAdminProducts'
import { useAdminCategories } from '@/hooks/useAdminCategories'
import ProductMediaManager from './ProductMediaManager'

interface FormData {
  name: string; slug: string; description: string
  price: number; stock: number; categoryId: string; isActive: boolean
}

export default function ProductForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { data: product } = useAdminProduct(id ?? '')
  const { data: categories } = useAdminCategories()
  const create = useCreateProduct()
  const update = useUpdateProduct(id ?? '')
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  useEffect(() => {
    if (product) {
      reset({
        name: product.name, slug: product.slug, description: product.description ?? '',
        price: Number(product.price), stock: product.stock,
        categoryId: product.category.id, isActive: product.isActive,
      })
    }
  }, [product, reset])

  async function onSubmit(data: FormData) {
    if (isEdit) { await update.mutateAsync(data) }
    else { await create.mutateAsync(data) }
    navigate('/products')
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600">←</button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Editar produto' : 'Novo produto'}</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white border rounded-2xl p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nome *</label>
          <input {...register('name', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.name && <p className="text-red-400 text-xs mt-1">Obrigatório</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <input {...register('slug', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea {...register('description')} rows={3} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Preço (R$) *</label>
            <input type="number" step="0.01" {...register('price', { required: true, valueAsNumber: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estoque *</label>
            <input type="number" min="0" {...register('stock', { required: true, valueAsNumber: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria *</label>
            <select {...register('categoryId', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione...</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" {...register('isActive')} className="rounded" />
          <label htmlFor="isActive" className="text-sm">Produto ativo</label>
        </div>
        <button type="submit" disabled={create.isPending || update.isPending}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
          {create.isPending || update.isPending ? 'Salvando...' : 'Salvar produto'}
        </button>
      </form>
      {isEdit && id && <ProductMediaManager productId={id} />}
    </div>
  )
}
```

- [ ] **Step 4: Create src/pages/products/ProductMediaManager.tsx**

```typescript
import { useAdminProduct, useAddProductMedia, useDeleteProductMedia } from '@/hooks/useAdminProducts'

export default function ProductMediaManager({ productId }: { productId: string }) {
  const { data: product } = useAdminProduct(productId)
  const addMedia = useAddProductMedia(productId)
  const deleteMedia = useDeleteProductMedia(productId)

  function handleAdd() {
    const url = prompt('URL da imagem ou vídeo:')
    if (!url) return
    const type = /\.(mp4|webm|ogg)$/i.test(url) ? 'video' : 'image'
    addMedia.mutate({ type, url })
  }

  return (
    <div className="mt-6 bg-white border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Mídia</h2>
        <button onClick={handleAdd} className="text-sm text-blue-600 hover:underline">+ Adicionar URL</button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {product?.media.map((m) => (
          <div key={m.id} className="relative group">
            <img src={m.url} alt="" className="w-full aspect-square object-cover rounded-xl" />
            <button
              onClick={() => { if (confirm('Remover?')) deleteMedia.mutate(m.id) }}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add admin/src/pages/products/ admin/src/components/StatusBadge.tsx
git commit -m "feat: add admin products pages with stock field"
```

---

## Task 6: Orders Pages

- [ ] **Step 1: Create src/pages/orders/OrderList.tsx**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminOrders } from '@/hooks/useAdminOrders'
import StatusBadge from '@/components/StatusBadge'

const STATUSES = ['', 'submitted', 'in_review', 'confirmed', 'cancelled']
const STATUS_LABELS: Record<string, string> = {
  '': 'Todos', submitted: 'Enviado', in_review: 'Em análise', confirmed: 'Confirmado', cancelled: 'Cancelado'
}

export default function OrderList() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const { data: orders, isLoading } = useAdminOrders(status ? { status } : undefined)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {isLoading && <p className="text-gray-400">Carregando...</p>}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Cidade</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Total</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Data</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders?.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-400">#{o.id.slice(-6).toUpperCase()}</td>
                <td className="px-4 py-3">{o.user.firstName}{o.user.username ? ` @${o.user.username}` : ''}</td>
                <td className="px-4 py-3 text-gray-500">{o.city.name}</td>
                <td className="px-4 py-3 font-medium">R$ {Number(o.totalAmount).toFixed(2)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => navigate(`/orders/${o.id}`)} className="text-blue-600 hover:underline text-sm">Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/pages/orders/OrderDetail.tsx**

```typescript
import { useParams, useNavigate } from 'react-router-dom'
import { useAdminOrder, useUpdateOrderStatus } from '@/hooks/useAdminOrders'
import StatusBadge from '@/components/StatusBadge'

const NEXT_STATUS: Record<string, string[]> = {
  submitted: ['in_review', 'cancelled'],
  in_review: ['confirmed', 'cancelled'],
  confirmed: [],
  cancelled: [],
}

const STATUS_LABELS: Record<string, string> = {
  in_review: 'Em análise', confirmed: 'Confirmar', cancelled: 'Cancelar'
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading } = useAdminOrder(id!)
  const updateStatus = useUpdateOrderStatus(id!)

  if (isLoading) return <div className="p-8 text-gray-400">Carregando...</div>
  if (!order) return null

  const nextStatuses = NEXT_STATUS[order.status] ?? []

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600">←</button>
        <h1 className="text-2xl font-bold">Pedido #{id!.slice(-6).toUpperCase()}</h1>
      </div>
      <div className="bg-white border rounded-2xl p-6 mb-4 space-y-3">
        <div className="flex justify-between"><span className="text-gray-500 text-sm">Cliente</span><span className="font-medium">{order.user.firstName}{order.user.username ? ` (@${order.user.username})` : ''}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 text-sm">Telegram ID</span><span className="font-mono text-sm">{order.user.telegramId}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 text-sm">Cidade</span><span>{order.city.name}</span></div>
        <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">Status</span><StatusBadge status={order.status} /></div>
        <div className="flex justify-between"><span className="text-gray-500 text-sm">Data</span><span>{new Date(order.createdAt).toLocaleString('pt-BR')}</span></div>
        {order.notes && <div><span className="text-gray-500 text-sm">Obs</span><p className="mt-1 text-sm">{order.notes}</p></div>}
      </div>
      <div className="bg-white border rounded-2xl p-6 mb-4">
        <h2 className="font-semibold mb-3">Itens</h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.productNameSnapshot} × {item.quantity}</span>
              <span className="font-medium">R$ {Number(item.lineTotal).toFixed(2)}</span>
            </div>
          ))}
          <div className="pt-2 border-t flex justify-between font-bold">
            <span>Total</span><span>R$ {Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>
      {nextStatuses.length > 0 && (
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="font-semibold mb-3">Atualizar status</h2>
          <div className="flex gap-2">
            {nextStatuses.map((s) => (
              <button key={s} onClick={() => updateStatus.mutate(s)} disabled={updateStatus.isPending}
                className={`px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 ${s === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {STATUS_LABELS[s] ?? s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/pages/orders/
git commit -m "feat: add admin orders pages with status transitions"
```

---

## Task 7: Cities + Categories + Settings Pages

- [ ] **Step 1: Create src/pages/cities/CityList.tsx**

```typescript
import { useNavigate } from 'react-router-dom'
import { useAdminCities } from '@/hooks/useAdminCities'
import type { AdminCity } from '@/hooks/useAdminCities'
import { useUpdateCity } from '@/hooks/useAdminCities'

function CityRow({ city }: { city: AdminCity }) {
  const navigate = useNavigate()
  const toggle = useUpdateCity(city.id)
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">{city.name}</td>
      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{city.slug}</td>
      <td className="px-4 py-3">{city.sortOrder}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${city.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {city.isActive ? 'Ativa' : 'Inativa'}
        </span>
      </td>
      <td className="px-4 py-3 text-right space-x-2">
        <button onClick={() => navigate(`/cities/${city.id}/edit`)} className="text-blue-600 hover:underline">Editar</button>
        <button onClick={() => toggle.mutate({ isActive: !city.isActive })} className="text-gray-400 hover:underline">
          {city.isActive ? 'Desativar' : 'Ativar'}
        </button>
      </td>
    </tr>
  )
}

export default function CityList() {
  const navigate = useNavigate()
  const { data: cities, isLoading } = useAdminCities()
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cidades</h1>
        <button onClick={() => navigate('/cities/new')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">+ Nova cidade</button>
      </div>
      {isLoading && <p className="text-gray-400">Carregando...</p>}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Ordem</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">{cities?.map((c) => <CityRow key={c.id} city={c} />)}</tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/pages/cities/CityForm.tsx**

```typescript
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAdminCities, useCreateCity, useUpdateCity } from '@/hooks/useAdminCities'

interface FormData { name: string; slug: string; sortOrder: number }

export default function CityForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { data: cities } = useAdminCities()
  const city = cities?.find((c) => c.id === id)
  const create = useCreateCity()
  const update = useUpdateCity(id ?? '')
  const { register, handleSubmit, reset } = useForm<FormData>({ defaultValues: { sortOrder: 0 } })

  useEffect(() => { if (city) reset({ name: city.name, slug: city.slug, sortOrder: city.sortOrder }) }, [city, reset])

  async function onSubmit(data: FormData) {
    if (id) { await update.mutateAsync(data) } else { await create.mutateAsync(data) }
    navigate('/cities')
  }

  return (
    <div className="p-8 max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600">←</button>
        <h1 className="text-2xl font-bold">{id ? 'Editar cidade' : 'Nova cidade'}</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border rounded-2xl p-6 space-y-4">
        <div><label className="block text-sm font-medium mb-1">Nome *</label><input {...register('name', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium mb-1">Slug *</label><input {...register('slug', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium mb-1">Ordem</label><input type="number" {...register('sortOrder', { valueAsNumber: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <button type="submit" disabled={create.isPending || update.isPending} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
          {create.isPending || update.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Create src/pages/categories/CategoryList.tsx**

```typescript
import { useNavigate } from 'react-router-dom'
import { useAdminCategories, useUpdateCategory, useDeleteCategory } from '@/hooks/useAdminCategories'
import type { AdminCategory } from '@/hooks/useAdminCategories'

function CategoryRow({ category }: { category: AdminCategory }) {
  const navigate = useNavigate()
  const toggle = useUpdateCategory(category.id)
  const remove = useDeleteCategory()
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">{category.name}</td>
      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{category.slug}</td>
      <td className="px-4 py-3">{category.sortOrder}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {category.isActive ? 'Ativa' : 'Inativa'}
        </span>
      </td>
      <td className="px-4 py-3 text-right space-x-2">
        <button onClick={() => navigate(`/categories/${category.id}/edit`)} className="text-blue-600 hover:underline">Editar</button>
        <button onClick={() => toggle.mutate({ isActive: !category.isActive })} className="text-gray-400 hover:underline">
          {category.isActive ? 'Desativar' : 'Ativar'}
        </button>
        <button onClick={() => { if (confirm(`Remover "${category.name}"?`)) remove.mutate(category.id) }} className="text-red-400 hover:underline">Remover</button>
      </td>
    </tr>
  )
}

export default function CategoryList() {
  const navigate = useNavigate()
  const { data: categories, isLoading } = useAdminCategories()
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <button onClick={() => navigate('/categories/new')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">+ Nova categoria</button>
      </div>
      {isLoading && <p className="text-gray-400">Carregando...</p>}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Ordem</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">{categories?.map((c) => <CategoryRow key={c.id} category={c} />)}</tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create src/pages/categories/CategoryForm.tsx**

```typescript
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAdminCategories, useCreateCategory, useUpdateCategory } from '@/hooks/useAdminCategories'

interface FormData { name: string; slug: string; sortOrder: number }

export default function CategoryForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { data: categories } = useAdminCategories()
  const category = categories?.find((c) => c.id === id)
  const create = useCreateCategory()
  const update = useUpdateCategory(id ?? '')
  const { register, handleSubmit, reset } = useForm<FormData>({ defaultValues: { sortOrder: 0 } })

  useEffect(() => {
    if (category) reset({ name: category.name, slug: category.slug, sortOrder: category.sortOrder })
  }, [category, reset])

  async function onSubmit(data: FormData) {
    if (id) { await update.mutateAsync(data) } else { await create.mutateAsync(data) }
    navigate('/categories')
  }

  return (
    <div className="p-8 max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600">←</button>
        <h1 className="text-2xl font-bold">{id ? 'Editar categoria' : 'Nova categoria'}</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border rounded-2xl p-6 space-y-4">
        <div><label className="block text-sm font-medium mb-1">Nome *</label><input {...register('name', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium mb-1">Slug *</label><input {...register('slug', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium mb-1">Ordem</label><input type="number" {...register('sortOrder', { valueAsNumber: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <button type="submit" disabled={create.isPending || update.isPending} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
          {create.isPending || update.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Create src/pages/settings/StoreSettings.tsx**

```typescript
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAdminSettings, useUpdateSettings } from '@/hooks/useAdminSettings'
import type { StoreSetting } from '@/hooks/useAdminSettings'

type FormData = Omit<StoreSetting, 'id'>

export default function StoreSettings() {
  const { data: settings } = useAdminSettings()
  const update = useUpdateSettings()
  const { register, handleSubmit, reset } = useForm<FormData>()

  useEffect(() => { if (settings) reset(settings) }, [settings, reset])

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Configurações da loja</h1>
      <form onSubmit={handleSubmit((data) => update.mutate(data))} className="bg-white border rounded-2xl p-6 space-y-4">
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
        <button type="submit" disabled={update.isPending} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
          {update.isPending ? 'Salvando...' : 'Salvar configurações'}
        </button>
        {update.isSuccess && <p className="text-green-600 text-sm text-center">Salvo com sucesso!</p>}
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add admin/src/pages/
git commit -m "feat: add cities, categories, and settings pages with adminTelegramId"
```

---

## Task 8: Build Verification

- [ ] **Step 1: Start dev server**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/admin && npm run dev
```

Expected: `Local: http://localhost:5174/`

- [ ] **Step 2: Verify login flow**

Open `http://localhost:5174/` — should redirect to `/login`. Enter `ADMIN_SECRET` from `.env` — should redirect to dashboard.

- [ ] **Step 3: Build check**

```bash
cd /Users/hover/Desktop/Programas/app-lojinha/admin && npm run build
```

Expected: `dist/` created, no TypeScript errors.

- [ ] **Step 4: Final commit**

```bash
git add admin/
git commit -m "feat: complete admin panel MVP"
```
