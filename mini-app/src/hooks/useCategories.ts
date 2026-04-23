import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Category { id: string; name: string; slug: string }

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  })
}
