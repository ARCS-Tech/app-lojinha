import { useNavigate } from 'react-router-dom'

const cards = [
  { to: '/products', label: 'Produtos', icon: '📦', desc: 'Gerenciar catálogo' },
  { to: '/orders', label: 'Pedidos', icon: '🧾', desc: 'Ver e atualizar pedidos' },
  { to: '/cities', label: 'Cidades', icon: '🏙️', desc: 'Cidades disponíveis' },
  { to: '/categories', label: 'Categorias', icon: '🗂️', desc: 'Categorias de produtos' },
  { to: '/settings', label: 'Configurações', icon: '⚙️', desc: 'Dados da loja' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Painel</h1>
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        {cards.map((c) => (
          <button key={c.to} onClick={() => navigate(c.to)} className="text-left bg-white border rounded-2xl p-5 hover:shadow-md transition-shadow">
            <p className="text-3xl mb-2">{c.icon}</p>
            <p className="font-semibold">{c.label}</p>
            <p className="text-gray-400 text-sm">{c.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
