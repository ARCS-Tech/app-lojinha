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
