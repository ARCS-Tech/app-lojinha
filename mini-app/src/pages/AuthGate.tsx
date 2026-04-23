import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { t } from '@/hooks/useTranslation'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  const { login, isLoading, isError } = useAuth()

  useEffect(() => { if (!token) login() }, [token, login])

  if (!token) {
    if (isError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-bg">
          <div className="text-center p-6">
            <p className="text-error mb-4">{t('auth_error')}</p>
            <button
              onClick={() => login()}
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          {isLoading && <p className="text-muted text-sm">{t('authenticating')}</p>}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
