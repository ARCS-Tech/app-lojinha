import { useNavigate } from 'react-router-dom'
import type { ProductSummary } from '@/hooks/useProducts'
import { t } from '@/hooks/useTranslation'

export default function ProductCard({ product }: { product: ProductSummary }) {
  const navigate = useNavigate()
  const image = product.media[0]?.url
  const outOfStock = product.stock === 0

  return (
    <button
      onClick={() => navigate(`/products/${product.id}`)}
      className="text-left bg-tg-secondary rounded-2xl overflow-hidden active:opacity-70 transition-opacity relative"
    >
      <div className="aspect-square w-full bg-tg-secondary overflow-hidden">
        {image ? (
          <img src={image} alt={product.name} className={`w-full h-full object-cover ${outOfStock ? 'opacity-50' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-tg-hint text-4xl">🛍️</div>
        )}
        {outOfStock && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
            {t('out_of_stock')}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-sm leading-tight line-clamp-2">{product.name}</p>
        <p className={`font-bold mt-1 ${outOfStock ? 'text-tg-hint' : 'text-tg-button'}`}>
          R$ {Number(product.price).toFixed(2)}
        </p>
      </div>
    </button>
  )
}
