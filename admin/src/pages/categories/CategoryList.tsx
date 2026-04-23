import { useNavigate } from 'react-router-dom'
import { useAdminCategories, useUpdateCategory, useDeleteCategory } from '@/hooks/useAdminCategories'
import type { AdminCategory } from '@/hooks/useAdminCategories'

function CategoryRow({ category }: { category: AdminCategory }) {
  const navigate = useNavigate()
  const toggle = useUpdateCategory(category.id)
  const remove = useDeleteCategory()
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">{category.name}</td>
      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{category.slug}</td>
      <td className="px-4 py-3">{category.sortOrder}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {category.isActive ? 'Ativa' : 'Inativa'}
        </span>
      </td>
      <td className="px-4 py-3 text-right space-x-2">
        <button onClick={() => navigate(`/categories/${category.id}/edit`)} className="text-blue-600 hover:underline">Editar</button>
        <button onClick={() => toggle.mutate({ isActive: !category.isActive })} className="text-gray-400 hover:underline">
          {category.isActive ? 'Desativar' : 'Ativar'}
        </button>
        <button onClick={() => { if (confirm(`Remover "${category.name}"?`)) remove.mutate(category.id) }} className="text-red-400 hover:underline">Remover</button>
      </td>
    </tr>
  )
}

export default function CategoryList() {
  const navigate = useNavigate()
  const { data: categories, isLoading } = useAdminCategories()
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <button onClick={() => navigate('/categories/new')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">+ Nova categoria</button>
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
          <tbody className="divide-y">{categories?.map((c) => <CategoryRow key={c.id} category={c} />)}</tbody>
        </table>
      </div>
    </div>
  )
}
