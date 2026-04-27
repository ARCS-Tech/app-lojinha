import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AccessLogUser {
  id: string
  firstName: string
  username: string | null
  telegramId: string
}

export interface GeoData {
  status: string
  country: string | null
  countryCode: string | null
  continent: string | null
  continentCode: string | null
  region: string | null
  regionName: string | null
  city: string | null
  zip: string | null
  lat: number | null
  lon: number | null
  timezone: string | null
  isp: string | null
  org: string | null
  asInfo: string | null
  mobile: boolean | null
  proxy: boolean | null
  hosting: boolean | null
}

export interface AdminAccessLog {
  id: number
  ip: string
  userAgent: string | null
  createdAt: string
  user: AccessLogUser | null
  geo: GeoData | null
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
