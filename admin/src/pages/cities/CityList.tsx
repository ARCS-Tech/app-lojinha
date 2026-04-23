import { useNavigate } from 'react-router-dom'
import { useAdminCities } from '@/hooks/useAdminCities'
import type { AdminCity } from '@/hooks/useAdminCities'
import { useUpdateCity } from '@/hooks/useAdminCities'

function CityRow({ city }: { city: AdminCity }) {
  const navigate = useNavigate()
  const toggle = useUpdateCity(city.id)
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">{city.name}</td>
      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{city.slug}</td>
      <td className="px-4 py-3">{city.sortOrder}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${city.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {city.isActive ? 'Ativa' : 'Inativa'}
        </span>
      </td>
      <td className="px-4 py-3 text-right space-x-2">
        <button onClick={() => navigate(`/cities/${city.id}/edit`)} className="text-blue-600 hover:underline">Editar</button>
        <button onClick={() => toggle.mutate({ isActive: !city.isActive })} className="text-gray-400 hover:underline">
          {city.isActive ? 'Desativar' : 'Ativar'}
        </button>
      </td>
    </tr>
  )
}

export default function CityList() {
  const navigate = useNavigate()
  const { data: cities, isLoading } = useAdminCities()
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cidades</h1>
        <button onClick={() => navigate('/cities/new')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">+ Nova cidade</button>
      </div>
      {isLoading && <p className="text-gray-400">Carregando...</p>}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Ordem</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">{cities?.map((c) => <CityRow key={c.id} city={c} />)}</tbody>
        </table>
      </div>
    </div>
  )
}
