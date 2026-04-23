import { useParams, useNavigate } from 'react-router-dom'
import { useOrder } from '@/hooks/useOrders'
import { t } from '@/hooks/useTranslation'

export default function OrderConfirm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order } = useOrder(id!)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h1 className="text-2xl font-bold mb-2">{t('order_received')}</h1>
      <p className="text-tg-hint mb-1">{t('order_success_desc')}</p>
      {order && <p className="text-tg-hint text-sm mb-8">{t('total')}: <strong>R$ {Number(order.totalAmount).toFixed(2)}</strong></p>}
      <div className="space-y-3 w-full max-w-xs">
        <button onClick={() => navigate('/orders')} className="w-full py-3 bg-tg-button text-tg-button-text rounded-xl font-semibold">{t('view_my_orders')}</button>
        <button onClick={() => navigate('/', { replace: true })} className="w-full py-3 bg-tg-secondary rounded-xl font-medium">{t('continue_shopping')}</button>
      </div>
    </div>
  )
}
