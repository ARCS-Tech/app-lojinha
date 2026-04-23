import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface StoreSettings {
  storeName: string; logoUrl?: string | null
  supportTelegramUrl?: string | null; defaultLanguage: string
}

export function useStoreSettings() {
  return useQuery<StoreSettings>({
    queryKey: ['store-settings'],
    queryFn: async () => (await api.get('/settings')).data,
    staleTime: 5 * 60 * 1000,
  })
}
