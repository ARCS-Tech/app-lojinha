import { tg } from '@/lib/telegram'
import { useStoreSettings } from '@/hooks/useStoreSettings'

export default function SupportFAB() {
  const { data: settings } = useStoreSettings()
  if (!settings?.supportTelegramUrl) return null
  return (
    <button
      onClick={() => tg?.openTelegramLink(settings.supportTelegramUrl!)}
      className="fixed bottom-6 left-6 w-14 h-14 bg-surface-2 rounded-full shadow-lg flex items-center justify-center text-2xl z-50 active:opacity-70"
    >
      💬
    </button>
  )
}
