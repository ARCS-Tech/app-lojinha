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
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-2">{t('select_city')}</h1>
      <p className="text-tg-hint text-sm mb-6">{t('select_city_desc')}</p>

      {error && <p className="text-red-500 text-sm mb-4">{t('city_select_error')}</p>}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-tg-secondary rounded-xl animate-pulse" />)}
        </div>
      )}

      <div className="space-y-3">
        {cities?.map((city) => (
          <button
            key={city.id}
            onClick={() => selectCity(city.id)}
            disabled={selectingId !== null}
            className="w-full text-left px-4 py-4 bg-tg-secondary rounded-xl font-medium active:opacity-60 transition-opacity disabled:opacity-50"
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  )
}
