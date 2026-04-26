import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AdminProduct {
  id: string; name: string; slug: string; description?: string
  price: number; stock: number; isActive: boolean
  category: { id: string; name: string }
  media: Array<{ id: string; url: string; type: string; sortOrder: number }>
}

export interface CreateProductPayload {
  name: string; slug: string; description?: string
  price: number; stock: number; categoryId: string; isActive?: boolean
  imageUrl?: string
}

export interface UpdateProductPayload {
  name?: string; slug?: string; description?: string
  price?: number; stock?: number; categoryId?: string; isActive?: boolean
}

export function useAdminProducts() {
  return useQuery<AdminProduct[]>({ queryKey: ['admin', 'products'], queryFn: async () => (await api.get('/admin/products')).data })
}

export function useAdminProduct(id: string) {
  return useQuery<AdminProduct>({ queryKey: ['admin', 'products', id], queryFn: async () => (await api.get(`/admin/products/${id}`)).data, enabled: !!id })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ imageUrl, ...data }: CreateProductPayload) => {
      const payload = {
        ...data,
        ...(imageUrl ? { media: [{ type: 'image', url: imageUrl, sortOrder: 0 }] } : {}),
      }
      return api.post('/admin/products', payload).then((r) => r.data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateProductPayload) => api.patch(`/admin/products/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useAddProductMedia(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { type: string; url: string; sortOrder?: number }) => api.post(`/admin/products/${productId}/media`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products', productId] }),
  })
}

export function useDeleteProductMedia(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (mediaId: string) => api.delete(`/admin/products/${productId}/media/${mediaId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products', productId] }),
  })
}
