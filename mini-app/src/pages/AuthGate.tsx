import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { t } from '@/hooks/useTranslation'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  const { login, isLoading } = useAuth()

  useEffect(() => { if (!token) login() }, [token, login])

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-tg-button border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          {isLoading && <p className="text-tg-hint text-sm">{t('authenticating')}</p>}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
