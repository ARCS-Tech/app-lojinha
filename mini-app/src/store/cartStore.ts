import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string; name: string; price: number; quantity: number; imageUrl?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.productId === item.productId)
        if (existing) return { items: state.items.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i) }
        return { items: [...state.items, item] }
      }),
      updateQuantity: (productId, quantity) => set((state) => ({
        items: quantity <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.map((i) => i.productId === productId ? { ...i, quantity } : i),
      })),
      removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'lojinha-cart' }
  )
)
