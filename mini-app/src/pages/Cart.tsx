import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useCheckout } from '@/hooks/useOrders'
import { useAuthStore } from '@/store/authStore'
import { t } from '@/hooks/useTranslation'

export default function Cart() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, total } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const checkout = useCheckout()

  async function handleCheckout() {
    if (!user?.selectedCityId || items.length === 0) return
    try {
      const order = await checkout.mutateAsync({
        cityId: user.selectedCityId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      navigate(`/orders/${order.id}/confirm`, { replace: true })
    } catch {
      // checkout.isError becomes true; error message rendered below
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-5xl mb-4">🛒</p>
        <p className="text-tg-hint text-center">{t('cart_empty')}</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-3 bg-tg-button text-tg-button-text rounded-xl font-semibold">
          {t('view_products')}
        </button>
      </div>
    )
  }

  return (
    <div className="pb-36">
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="text-tg-link text-sm mb-4 block">← {t('continue_shopping')}</button>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 bg-tg-secondary p-3 rounded-xl">
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-none" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-tight line-clamp-2">{item.name}</p>
                <p className="text-tg-button font-bold mt-1">R$ {item.price.toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-center gap-1 flex-none">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-7 h-7 bg-tg-bg rounded-full flex items-center justify-center font-bold">−</button>
                  <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-7 h-7 bg-tg-bg rounded-full flex items-center justify-center font-bold">+</button>
                </div>
                <button onClick={() => removeItem(item.productId)} className="text-xs text-red-400">{t('remove')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-tg-bg border-t border-tg-secondary">
        <div className="flex items-center justify-between mb-3">
          <span className="text-tg-hint">{t('total')}</span>
          <span className="text-xl font-bold">R$ {total().toFixed(2)}</span>
        </div>
        {checkout.isError && (
          <p className="text-red-500 text-sm text-center mb-2">{t('checkout_error')}</p>
        )}
        <button onClick={handleCheckout} disabled={checkout.isPending}
          className="w-full py-4 bg-tg-button text-tg-button-text rounded-xl font-semibold disabled:opacity-50">
          {checkout.isPending ? t('sending_order') : t('confirm_order')}
        </button>
      </div>
    </div>
  )
}
