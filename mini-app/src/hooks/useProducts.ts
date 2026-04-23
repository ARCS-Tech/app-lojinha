import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ProductSummary {
  id: string; name: string; price: number; stock: number
  category: { id: string; name: string }
  media: Array<{ url: string; type: string }>
}

export function useProducts(params?: { categoryId?: string; search?: string }) {
  return useQuery<ProductSummary[]>({
    queryKey: ['products', params],
    queryFn: async () => (await api.get('/products', { params })).data,
  })
}
