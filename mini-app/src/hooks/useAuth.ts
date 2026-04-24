import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getInitData } from '@/lib/telegram'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/store/authStore'

export function useAuth() {
  const { setAuth, user, token } = useAuthStore()
  const loginMutation = useMutation({
    mutationFn: async () => {
      const initData = getInitData()
      console.log('[Auth] initData:', initData ? `${initData.slice(0, 30)}...` : 'EMPTY')
      console.log('[Auth] API URL:', import.meta.env.VITE_API_URL ?? 'NOT SET (will use localhost)')
      const res = await api.post('/auth/telegram', { initData })
      return res.data as { token: string; user: User }
    },
    onSuccess: ({ token, user }) => setAuth(token, user),
  })
  return {
    login: loginMutation.mutate,
    isLoading: loginMutation.isPending,
    isError: loginMutation.isError,
    error: loginMutation.error,
    user,
    token,
  }
}
