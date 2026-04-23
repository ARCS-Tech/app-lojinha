import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getInitData } from '@/lib/telegram'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { setAuth, user, token } = useAuthStore()
  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/telegram', { initData: getInitData() })
      return res.data as { token: string; user: any }
    },
    onSuccess: ({ token, user }) => setAuth(token, user),
  })
  return { login: loginMutation.mutate, isLoading: loginMutation.isPending, user, token }
}
