declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string
        initDataUnsafe: { user?: { id: number; first_name: string; last_name?: string; username?: string; language_code?: string } }
        ready(): void
        expand(): void
        close(): void
        MainButton: { text: string; show(): void; hide(): void; onClick(fn: () => void): void; offClick(fn: () => void): void; isVisible: boolean }
        BackButton: { show(): void; hide(): void; onClick(fn: () => void): void; offClick(fn: () => void): void }
        openTelegramLink(url: string): void
        themeParams: Record<string, string>
        colorScheme: 'light' | 'dark'
      }
    }
  }
}

export const tg = window.Telegram?.WebApp

const DEV_USER = { id: 1, first_name: 'Dev', last_name: 'User', username: 'devuser', language_code: 'pt' }

export const getInitData = (): string => {
  if (tg?.initData) return tg.initData
  if (import.meta.env.DEV) return `dev:${JSON.stringify(DEV_USER)}`
  return ''
}
export const getTelegramUser = () => tg?.initDataUnsafe?.user
