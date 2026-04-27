import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminStore } from '@/store/adminStore'

const navItems = [
  { to: '/products', label: '📦 Produtos' },
  { to: '/orders', label: '🧾 Pedidos' },
  { to: '/cities', label: '🏙️ Cidades' },
  { to: '/categories', label: '🗂️ Categorias' },
  { to: '/access-logs', label: '📡 Logs de Acesso' },
  { to: '/settings', label: '⚙️ Configurações' },
]

export default function Layout() {
  const logout = useAdminStore((s) => s.logout)
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="p-5 border-b"><h1 className="font-bold text-lg">Lojinha Admin</h1></div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  )
}
