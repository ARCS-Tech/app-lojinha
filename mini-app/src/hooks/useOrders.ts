import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCartStore } from '@/store/cartStore'

export interface Order {
  id: string; status: string; totalAmount: number; createdAt: string
  city: { name: string }
  items: Array<{ id: string; productNameSnapshot: string; unitPriceSnapshot: number; quantity: number; lineTotal: number }>
}

export function useOrders() {
  return useQuery<Order[]>({ queryKey: ['orders', 'me'], queryFn: async () => (await api.get('/orders/me')).data })
}

export function useOrder(id: string) {
  return useQuery<Order>({ queryKey: ['orders', id], queryFn: async () => (await api.get(`/orders/${id}`)).data, enabled: !!id })
}

export function useCheckout() {
  const qc = useQueryClient()
  const clearCart = useCartStore((s) => s.clear)
  return useMutation({
    mutationFn: async (body: { cityId: string; items: Array<{ productId: string; quantity: number }> }) =>
      (await api.post('/orders/checkout', body)).data as Order,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); clearCart() },
  })
}
