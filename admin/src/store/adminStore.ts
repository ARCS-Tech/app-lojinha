import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAdminToken, clearAdminToken } from '@/lib/api'

interface AdminState {
  token: string | null
  setToken: (token: string) => void
  logout: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => { setAdminToken(token); set({ token }) },
      logout: () => { clearAdminToken(); set({ token: null }) },
    }),
    {
      name: 'admin-auth',
      onRehydrateStorage: () => (state) => { if (state?.token) setAdminToken(state.token) },
    }
  )
)
