import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface StoreSettings {
  storeName: string
  logoUrl?: string | null
  supportTelegramUrl?: string | null
  defaultLanguage: string
  primaryColor: string
  secondaryColor: string
}

function applyTheme(primaryColor: string, secondaryColor: string) {
  const root = document.documentElement
  root.style.setProperty('--color-primary', primaryColor)
  root.style.setProperty('--color-secondary', secondaryColor)
  const r = parseInt(primaryColor.slice(1, 3), 16)
  const g = parseInt(primaryColor.slice(3, 5), 16)
  const b = parseInt(primaryColor.slice(5, 7), 16)
  root.style.setProperty('--color-primary-soft', `rgba(${r},${g},${b},0.15)`)
  root.style.setProperty('--color-primary-glow', `rgba(${r},${g},${b},0.4)`)
}

export function useStoreSettings() {
  const query = useQuery<StoreSettings>({
    queryKey: ['store-settings'],
    queryFn: async () => (await api.get('/settings')).data,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (query.data?.primaryColor && query.data?.secondaryColor) {
      applyTheme(query.data.primaryColor, query.data.secondaryColor)
    }
  }, [query.data])

  return query
}
