import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface StoreSetting {
  id: string
  storeName: string
  logoUrl?: string
  supportTelegramUrl?: string
  adminTelegramId?: string
  defaultLanguage: string
  welcomeText?: string
  primaryColor: string
  secondaryColor: string
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
