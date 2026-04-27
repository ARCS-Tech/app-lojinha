import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AccessLogUser {
  id: string
  firstName: string
  username: string | null
  telegramId: string
}

export interface AdminAccessLog {
  id: number
  ip: string
  userAgent: string | null
  createdAt: string
  user: AccessLogUser | null
}

export interface AccessLogsResponse {
  data: AdminAccessLog[]
  total: number
  page: number
  totalPages: number
}

export interface AccessLogFilters {
  page?: number
  limit?: number
  from?: string
  to?: string
  ip?: string
  userId?: string
}

export function useAdminAccessLogs(filters: AccessLogFilters = {}) {
  return useQuery<AccessLogsResponse>({
    queryKey: ['admin', 'access-logs', filters],
    queryFn: async () =>
      (await api.get('/admin/access-logs', { params: filters })).data,
  })
}
