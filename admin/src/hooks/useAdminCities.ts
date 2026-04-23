import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AdminCity { id: string; name: string; slug: string; isActive: boolean; sortOrder: number }

export function useAdminCities() {
  return useQuery<AdminCity[]>({ queryKey: ['admin', 'cities'], queryFn: async () => (await api.get('/admin/cities')).data })
}

export function useCreateCity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; slug: string; sortOrder?: number }) => api.post('/admin/cities', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'cities'] }),
  })
}

export function useUpdateCity(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AdminCity>) => api.patch(`/admin/cities/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'cities'] }),
  })
}
