import { useParams, useNavigate } from 'react-router-dom'
import { useAdminOrder, useUpdateOrderStatus } from '@/hooks/useAdminOrders'
import StatusBadge from '@/components/StatusBadge'

const NEXT_STATUS: Record<string, string[]> = {
  submitted: ['in_review', 'cancelled'],
  in_review: ['confirmed', 'cancelled'],
  confirmed: [],
  cancelled: [],
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Enviar', in_review: 'Em análise', confirmed: 'Confirmar', cancelled: 'Cancelar'
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading } = useAdminOrder(id!)
  const updateStatus = useUpdateOrderStatus(id!)

  if (!id) return null
  if (isLoading) return <div className="p-8 text-gray-400">Carregando...</div>
  if (!order) return null

  const nextStatuses = NEXT_STATUS[order.status] ?? []

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600">←</button>
        <h1 className="text-2xl font-bold">Pedido #{id.slice(-6).toUpperCase()}</h1>
      </div>
      <div className="bg-white border rounded-2xl p-6 mb-4 space-y-3">
        <div className="flex justify-between"><span className="text-gray-500 text-sm">Cliente</span><span className="font-medium">{order.user.firstName}{order.user.username ? ` (@${order.user.username})` : ''}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 text-sm">Telegram ID</span><span className="font-mono text-sm">{order.user.telegramId}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 text-sm">Cidade</span><span>{order.city.name}</span></div>
        <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">Status</span><StatusBadge status={order.status} /></div>
        <div className="flex justify-between"><span className="text-gray-500 text-sm">Data</span><span>{new Date(order.createdAt).toLocaleString('pt-BR')}</span></div>
        {order.notes && <div><span className="text-gray-500 text-sm">Obs</span><p className="mt-1 text-sm">{order.notes}</p></div>}
      </div>
      <div className="bg-white border rounded-2xl p-6 mb-4">
        <h2 className="font-semibold mb-3">Itens</h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.productNameSnapshot} × {item.quantity}</span>
              <span className="font-medium">R$ {Number(item.lineTotal).toFixed(2)}</span>
            </div>
          ))}
          <div className="pt-2 border-t flex justify-between font-bold">
            <span>Total</span><span>R$ {Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>
      {nextStatuses.length > 0 && (
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="font-semibold mb-3">Atualizar status</h2>
          <div className="flex gap-2">
            {nextStatuses.map((s) => (
              <button key={s} onClick={() => updateStatus.mutate(s)} disabled={updateStatus.isPending}
                className={`px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 ${s === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {STATUS_LABELS[s] ?? s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
