import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAdminCities, useCreateCity, useUpdateCity } from '@/hooks/useAdminCities'

interface FormData { name: string; slug: string; sortOrder: number }

export default function CityForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { data: cities } = useAdminCities()
  const city = cities?.find((c) => c.id === id)
  const create = useCreateCity()
  const update = useUpdateCity(id ?? '')
  const { register, handleSubmit, reset } = useForm<FormData>({ defaultValues: { sortOrder: 0 } })

  useEffect(() => { if (city) reset({ name: city.name, slug: city.slug, sortOrder: city.sortOrder }) }, [city, reset])

  async function onSubmit(data: FormData) {
    if (id) { await update.mutateAsync(data) } else { await create.mutateAsync(data) }
    navigate('/cities')
  }

  return (
    <div className="p-8 max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600">←</button>
        <h1 className="text-2xl font-bold">{id ? 'Editar cidade' : 'Nova cidade'}</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border rounded-2xl p-6 space-y-4">
        <div><label className="block text-sm font-medium mb-1">Nome *</label><input {...register('name', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium mb-1">Slug *</label><input {...register('slug', { required: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-sm font-medium mb-1">Ordem</label><input type="number" {...register('sortOrder', { valueAsNumber: true })} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <button type="submit" disabled={create.isPending || update.isPending} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
          {create.isPending || update.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
