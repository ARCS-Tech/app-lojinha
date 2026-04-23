import { useParams, useNavigate } from 'react-router-dom'
import { useOrder } from '@/hooks/useOrders'
import StatusBadge from '@/components/StatusBadge'
import { t } from '@/hooks/useTranslation'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading } = useOrder(id!)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!order) return null

  return (
    <div className="p-4 bg-bg min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-secondary">{t('back')}</button>
        <h1 className="text-xl font-bold text-text">{t('order_details')}</h1>
      </div>
      <div className="bg-surface rounded-2xl p-4 mb-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">{t('order')}</span>
          <span className="font-mono text-sm text-text">#{order.id.slice(-6).toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">{t('status')}</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">{t('city')}</span>
          <span className="text-sm text-text">{order.city.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">{t('date')}</span>
          <span className="text-sm text-text">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      <div className="mb-4 bg-surface rounded-2xl overflow-hidden">
        {order.items.map((item, i) => (
          <div
            key={item.id}
            className={`flex justify-between items-center p-4 ${i < order.items.length - 1 ? 'border-b border-border' : ''}`}
          >
            <div>
              <p className="text-sm font-medium text-text">{item.productNameSnapshot}</p>
              <p className="text-xs text-muted">{item.quantity}x R$ {Number(item.unitPriceSnapshot).toFixed(2)}</p>
            </div>
            <p className="font-bold text-sm text-text">R$ {Number(item.lineTotal).toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center bg-surface p-4 rounded-2xl">
        <span className="font-semibold text-muted">{t('total')}</span>
        <span className="text-xl font-bold text-secondary">R$ {Number(order.totalAmount).toFixed(2)}</span>
      </div>
    </div>
  )
}
