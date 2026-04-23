import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'

export default function CartFAB() {
  const navigate = useNavigate()
  const count = useCartStore((s) => s.count())
  if (count === 0) return null
  return (
    <button
      onClick={() => navigate('/cart')}
      className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center text-2xl z-50 active:opacity-70"
      style={{ boxShadow: '0 4px 24px var(--color-primary-glow)' }}
    >
      🛒
      <span className="absolute -top-1 -right-1 bg-error text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    </button>
  )
}
