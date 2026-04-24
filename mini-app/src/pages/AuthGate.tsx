import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { t } from '@/hooks/useTranslation'

function getDebugInfo() {
  const tgExists = !!window.Telegram?.WebApp
  const initData = window.Telegram?.WebApp?.initData ?? 'N/A'
  const initDataLen = initData.length
  const apiUrl = import.meta.env.VITE_API_URL ?? 'NOT SET'
  return { tgExists, initDataLen, apiUrl, initDataPreview: initData.slice(0, 40) || 'EMPTY' }
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  const { login, isLoading, isError, error } = useAuth()

  // Always re-authenticate on mount using Telegram initData.
  // The cached token (if any) is used for API requests while this runs.
  useEffect(() => { login() }, [])

  if (!token) {
    if (isError) {
      const dbg = getDebugInfo()
      return (
        <div className="flex items-center justify-center min-h-screen bg-bg">
          <div className="text-center p-6">
            <p className="text-error mb-4">{t('auth_error')}</p>
            <p className="text-muted text-xs mb-2 break-all">{String(error)}</p>
            <div className="text-left text-xs text-muted bg-surface-2 rounded p-3 mb-4 space-y-1">
              <p>TG SDK: {dbg.tgExists ? 'OK' : 'MISSING'}</p>
              <p>initData: {dbg.initDataPreview}</p>
              <p>initData len: {dbg.initDataLen}</p>
              <p>API: {dbg.apiUrl}</p>
            </div>
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
