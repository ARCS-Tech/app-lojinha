import { useEffect } from 'react'
import { useTranslation, setLanguage } from '@/hooks/useTranslation'
import type { Lang } from '@/hooks/useTranslation'
import { useStoreSettings } from '@/hooks/useStoreSettings'

export default function Header() {
  const { lang } = useTranslation()
  const { data: settings } = useStoreSettings()

  useEffect(() => {
    if (settings?.defaultLanguage && !localStorage.getItem('lojinha-lang')) {
      const l = settings.defaultLanguage as Lang
      setLanguage(l)
    }
  }, [settings?.defaultLanguage])

  return (
    <header className="sticky top-0 z-20 bg-bg backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
      <h1 className="font-bold text-lg text-text truncate">{settings?.storeName ?? 'Loja'}</h1>
      <div className="flex gap-1 flex-none">
        {(['pt', 'es', 'en'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLanguage(l)}
            className={`px-2 py-1 rounded text-xs font-medium uppercase transition-colors ${
              lang === l ? 'bg-primary text-white' : 'bg-surface-2 text-muted'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </header>
  )
}
