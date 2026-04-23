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
export const getInitData = (): string => tg?.initData ?? ''
export const getTelegramUser = () => tg?.initDataUnsafe?.user
