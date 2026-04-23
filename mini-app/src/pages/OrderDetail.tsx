import { useParams, useNavigate } from 'react-router-dom'
import { useOrder } from '@/hooks/useOrders'
import StatusBadge from '@/components/StatusBadge'
import { t } from '@/hooks/useTranslation'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading } = useOrder(id!)

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-tg-button border-t-transparent rounded-full animate-spin" /></div>
  if (!order) return null

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-tg-link">{t('back')}</button>
        <h1 className="text-xl font-bold">{t('order_details')}</h1>
      </div>
      <div className="bg-tg-secondary rounded-xl p-4 mb-4 space-y-2">
        <div className="flex justify-between items-center"><span className="text-sm text-tg-hint">{t('order')}</span><span className="font-mono text-sm">#{order.id.slice(-6).toUpperCase()}</span></div>
        <div className="flex justify-between items-center"><span className="text-sm text-tg-hint">{t('status')}</span><StatusBadge status={order.status} /></div>
        <div className="flex justify-between items-center"><span className="text-sm text-tg-hint">{t('city')}</span><span className="text-sm">{order.city.name}</span></div>
        <div className="flex justify-between items-center"><span className="text-sm text-tg-hint">{t('date')}</span><span className="text-sm">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span></div>
      </div>
      <div className="space-y-2 mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-center bg-tg-secondary p-3 rounded-xl">
            <div>
              <p className="text-sm font-medium">{item.productNameSnapshot}</p>
              <p className="text-xs text-tg-hint">{item.quantity}x R$ {Number(item.unitPriceSnapshot).toFixed(2)}</p>
            </div>
            <p className="font-bold text-sm">R$ {Number(item.lineTotal).toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center bg-tg-secondary p-4 rounded-xl">
        <span className="font-semibold">{t('total')}</span>
        <span className="text-xl font-bold text-tg-button">R$ {Number(order.totalAmount).toFixed(2)}</span>
      </div>
    </div>
  )
}
