import { useLocation, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'

const tabs = [
  { path: '/', label: 'Catálogo', icon: '🛍️' },
  { path: '/cart', label: 'Carrinho', icon: '🛒' },
  { path: '/orders', label: 'Pedidos', icon: '📦' },
] as const

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 flex"
      style={{ height: 'var(--bottom-nav-height)' }}
    >
      {tabs.map((tab) => {
        const isActive = tab.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(tab.path)
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative active:opacity-70"
            style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
          >
            <div className="relative inline-flex">
              <span className="text-xl leading-none">{tab.icon}</span>
              {tab.path === '/cart' && cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-error text-white font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ fontSize: '10px' }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
