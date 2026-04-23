import { useNavigate } from 'react-router-dom'
import { useAdminProducts, useDeleteProduct } from '@/hooks/useAdminProducts'

export default function ProductList() {
  const navigate = useNavigate()
  const { data: products, isLoading } = useAdminProducts()
  const deleteProduct = useDeleteProduct()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <button onClick={() => navigate('/products/new')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          + Novo produto
        </button>
      </div>
      {isLoading && <p className="text-gray-400">Carregando...</p>}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Categoria</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Preço</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Estoque</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {products?.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.category.name}</td>
                <td className="px-4 py-3">R$ {Number(p.price).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={p.stock === 0 ? 'text-red-500 font-medium' : ''}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => navigate(`/products/${p.id}/edit`)} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => { if (confirm(`Desativar "${p.name}"?`)) deleteProduct.mutate(p.id) }} className="text-red-400 hover:underline">Desativar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
