import { useNavigate } from 'react-router-dom'
import { useOrders } from '@/hooks/useOrders'
import StatusBadge from '@/components/StatusBadge'
import { t } from '@/hooks/useTranslation'

export default function Orders() {
  const navigate = useNavigate()
  const { data: orders, isLoading } = useOrders()
  return (
    <div className="p-4 bg-bg min-h-screen">
      <h1 className="text-xl font-bold text-text mb-6">{t('my_orders')}</h1>
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-surface rounded-xl animate-pulse" />)}
        </div>
      )}
      {orders?.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p className="text-4xl mb-3">📋</p>
          <p>{t('no_orders')}</p>
        </div>
      )}
      <div className="space-y-3">
        {orders?.map((order) => (
          <button key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="w-full text-left bg-surface border border-border p-4 rounded-xl">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-sm text-text">{t('order')} #{order.id.slice(-6).toUpperCase()}</p>
                <p className="text-xs text-muted mt-0.5">{order.city.name}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">{order.items.length} {order.items.length === 1 ? t('item') : t('items')}</p>
              <p className="font-bold text-secondary">R$ {Number(order.totalAmount).toFixed(2)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
