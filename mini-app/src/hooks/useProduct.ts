import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ProductDetail {
  id: string; name: string; description?: string; price: number; stock: number
  category: { id: string; name: string }
  media: Array<{ id: string; url: string; type: string; sortOrder: number }>
}

export function useProduct(id: string) {
  return useQuery<ProductDetail>({
    queryKey: ['products', id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
    enabled: !!id,
  })
}
