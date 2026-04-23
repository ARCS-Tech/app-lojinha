import { useAdminProduct, useAddProductMedia, useDeleteProductMedia } from '@/hooks/useAdminProducts'

export default function ProductMediaManager({ productId }: { productId: string }) {
  const { data: product } = useAdminProduct(productId)
  const addMedia = useAddProductMedia(productId)
  const deleteMedia = useDeleteProductMedia(productId)

  function handleAdd() {
    const url = prompt('URL da imagem ou vídeo:')
    if (!url) return
    const type = /\.(mp4|webm|ogg)$/i.test(url) ? 'video' : 'image'
    addMedia.mutate({ type, url })
  }

  return (
    <div className="mt-6 bg-white border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Mídia</h2>
        <button onClick={handleAdd} className="text-sm text-blue-600 hover:underline">+ Adicionar URL</button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {product?.media.map((m) => (
          <div key={m.id} className="relative group">
            <img src={m.url} alt="" className="w-full aspect-square object-cover rounded-xl" />
            <button
              onClick={() => { if (confirm('Remover?')) deleteMedia.mutate(m.id) }}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
