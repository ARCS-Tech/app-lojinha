import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProduct } from '@/hooks/useProduct'
import { useCartStore } from '@/store/cartStore'
import MediaGallery from '@/components/MediaGallery'
import { t } from '@/hooks/useTranslation'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading } = useProduct(id!)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  function handleAddToCart() {
    if (!product || product.stock === 0) return
    addItem({ productId: product.id, name: product.name, price: Number(product.price), quantity, imageUrl: product.media[0]?.url })
    navigate(-1)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="aspect-square w-full bg-tg-secondary animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-6 bg-tg-secondary rounded animate-pulse" />
          <div className="h-4 bg-tg-secondary rounded w-1/3 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-tg-hint">{t('product_not_found')}</p></div>
  }

  const outOfStock = product.stock === 0

  return (
    <div className="pb-32">
      <button onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 w-9 h-9 bg-tg-bg/80 backdrop-blur rounded-full flex items-center justify-center text-lg">
        {t('back')}
      </button>

      <MediaGallery media={product.media} />

      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs text-tg-hint uppercase tracking-wide">{product.category.name}</p>
          <h1 className="text-xl font-bold mt-1">{product.name}</h1>
          <p className="text-2xl font-bold text-tg-button mt-2">R$ {Number(product.price).toFixed(2)}</p>
          {outOfStock && (
            <p className="text-sm text-red-500 font-medium mt-1">{t('out_of_stock')}</p>
          )}
        </div>
        {product.description && <p className="text-sm text-tg-hint leading-relaxed">{product.description}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-tg-bg border-t border-tg-secondary">
        <div className="flex items-center gap-4">
          {!outOfStock && (
            <div className="flex items-center gap-3 bg-tg-secondary rounded-xl px-1">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 flex items-center justify-center text-xl font-bold">−</button>
              <span className="w-6 text-center font-bold">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-9 h-9 flex items-center justify-center text-xl font-bold">+</button>
            </div>
          )}
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex-1 py-3 bg-tg-button text-tg-button-text rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:opacity-70"
          >
            {outOfStock ? t('out_of_stock') : `${t('add_to_cart')} • R$ ${(Number(product.price) * quantity).toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
