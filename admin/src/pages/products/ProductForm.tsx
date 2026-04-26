import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAdminProduct, useCreateProduct, useUpdateProduct, type CreateProductPayload } from '@/hooks/useAdminProducts'
import { useAdminCategories } from '@/hooks/useAdminCategories'
import ProductMediaManager from './ProductMediaManager'

type FormData = CreateProductPayload & { description: string; isActive: boolean }

export default function ProductForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { data: product } = useAdminProduct(id ?? '')
  const { data: categories } = useAdminCategories()
  const create = useCreateProduct()
  const update = useUpdateProduct(id ?? '')
  const [submitError, setSubmitError] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  useEffect(() => {
    if (product) {
      reset({
        name: product.name, slug: product.slug, description: product.description ?? '',
        price: Number(product.price), stock: product.stock,
        categoryId: product.category.id, isActive: product.isActive,
      })
    }
  }, [product, reset])

  async function onSubmit(data: FormData) {
    setSubmitError(false)
    try {
      if (isEdit) { await update.mutateAsync(data) }
      else { await create.mutateAsync(data) }
      navigate('/products')
    } catch {
      setSubmitError(true)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600">←</button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Editar produto' : 'Novo produto'}</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white border rounded-2xl p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nome *</label>
          <input {...register('name', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.name && <p className="text-red-400 text-xs mt-1">Obrigatório</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <input {...register('slug', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea {...register('description')} rows={3} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Preço (R$) *</label>
            <input type="number" step="0.01" {...register('price', { required: true, valueAsNumber: true, min: 0.01 })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estoque *</label>
            <input type="number" min="0" {...register('stock', { required: true, valueAsNumber: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria *</label>
            <select {...register('categoryId', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione...</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium mb-1">URL da imagem</label>
            <input
              type="url"
              placeholder="https://exemplo.com/imagem.jpg"
              {...register('imageUrl')}
              className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Deixe em branco para usar o placeholder padrão</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" {...register('isActive')} className="rounded" />
          <label htmlFor="isActive" className="text-sm">Produto ativo</label>
        </div>
        <button type="submit" disabled={create.isPending || update.isPending}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
          {create.isPending || update.isPending ? 'Salvando...' : 'Salvar produto'}
        </button>
        {submitError && <p className="text-red-500 text-sm text-center">Erro ao salvar produto. Tente novamente.</p>}
      </form>
      {isEdit && id && <ProductMediaManager productId={id} />}
    </div>
  )
}
