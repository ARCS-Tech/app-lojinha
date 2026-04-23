import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAuthToken, clearAuthToken } from '@/lib/api'

interface User {
  id: string; telegramId: string; firstName: string
  lastName?: string; username?: string; selectedCityId?: string
}

interface AuthState {
  token: string | null; user: User | null
  setAuth: (token: string, user: User) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null, user: null,
      setAuth: (token, user) => { setAuthToken(token); set({ token, user }) },
      updateUser: (partial) => set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
      logout: () => { clearAuthToken(); set({ token: null, user: null }) },
    }),
    {
      name: 'lojinha-auth',
      onRehydrateStorage: () => (state) => { if (state?.token) setAuthToken(state.token) },
    }
  )
)
