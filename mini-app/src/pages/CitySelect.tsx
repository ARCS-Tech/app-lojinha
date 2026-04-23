import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCities } from '@/hooks/useCities'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { t } from '@/hooks/useTranslation'

export default function CitySelect() {
  const { data: cities, isLoading } = useCities()
  const updateUser = useAuthStore((s) => s.updateUser)
  const navigate = useNavigate()
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [error, setError] = useState(false)

  async function selectCity(cityId: string) {
    setSelectingId(cityId)
    setError(false)
    try {
      await api.patch('/users/me/city', { cityId })
      updateUser({ selectedCityId: cityId })
      navigate('/', { replace: true })
    } catch {
      setError(true)
    } finally {
      setSelectingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <h1 className="text-2xl font-bold text-text mb-2">{t('select_city')}</h1>
      <p className="text-muted text-sm mb-6">{t('select_city_desc')}</p>

      {error && <p className="text-error text-sm mb-4">{t('city_select_error')}</p>}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-surface rounded-xl animate-pulse" />)}
        </div>
      )}

      <div className="space-y-3">
        {cities?.map((city) => (
          <button
            key={city.id}
            onClick={() => selectCity(city.id)}
            disabled={selectingId !== null}
            className="w-full text-left px-4 py-4 bg-surface border border-border rounded-xl font-medium text-text active:opacity-60 transition-all disabled:opacity-50 hover:border-primary focus:border-primary"
          >
            <span className="flex items-center justify-between">
              {city.name}
              {selectingId === city.id && (
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
