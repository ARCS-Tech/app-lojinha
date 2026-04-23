import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface City { id: string; name: string; slug: string }

export function useCities() {
  return useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: async () => (await api.get('/cities')).data,
  })
}
