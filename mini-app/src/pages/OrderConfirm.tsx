import { useParams, useNavigate } from 'react-router-dom'
import { useOrder } from '@/hooks/useOrders'
import { t } from '@/hooks/useTranslation'

export default function OrderConfirm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order } = useOrder(id ?? '')
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-4xl text-white font-bold mb-6"
        style={{ background: 'radial-gradient(circle, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, transparent))' }}
      >
        ✓
      </div>
      <h1 className="text-2xl font-bold text-text mb-2">{t('order_received')}</h1>
      <p className="text-muted mb-1">{t('order_success_desc')}</p>
      {order && (
        <p className="text-secondary font-bold text-lg mb-8">
          {t('total')}: R$ {Number(order.totalAmount).toFixed(2)}
        </p>
      )}
      <div className="space-y-3 w-full max-w-xs">
        <button onClick={() => navigate('/orders')} className="w-full py-3 bg-primary text-white rounded-xl font-semibold">
          {t('view_my_orders')}
        </button>
        <button onClick={() => navigate('/', { replace: true })} className="w-full py-3 bg-surface-2 text-text rounded-xl font-medium">
          {t('continue_shopping')}
        </button>
      </div>
    </div>
  )
}
