import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminOrders } from '@/hooks/useAdminOrders'
import StatusBadge from '@/components/StatusBadge'

const STATUSES = ['', 'submitted', 'in_review', 'confirmed', 'cancelled']
const STATUS_LABELS: Record<string, string> = {
  '': 'Todos', submitted: 'Enviado', in_review: 'Em análise', confirmed: 'Confirmado', cancelled: 'Cancelado'
}

export default function OrderList() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const { data: orders, isLoading } = useAdminOrders(status ? { status } : undefined)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {isLoading && <p className="text-gray-400">Carregando...</p>}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Cidade</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Total</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Data</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders?.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-400">#{o.id.slice(-6).toUpperCase()}</td>
                <td className="px-4 py-3">{o.user.firstName}{o.user.username ? ` @${o.user.username}` : ''}</td>
                <td className="px-4 py-3 text-gray-500">{o.city.name}</td>
                <td className="px-4 py-3 font-medium">R$ {Number(o.totalAmount).toFixed(2)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => navigate(`/orders/${o.id}`)} className="text-blue-600 hover:underline text-sm">Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
