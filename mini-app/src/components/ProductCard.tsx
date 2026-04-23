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
      className="block text-left bg-surface rounded-2xl overflow-hidden active:opacity-80 transition-opacity relative w-full aspect-[3/4]"
    >
      {image ? (
        <img
          src={image}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover ${outOfStock ? 'opacity-50' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center text-muted text-4xl">🛍️</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
      {outOfStock && (
        <div className="absolute top-2 left-2 bg-error/15 text-error text-xs font-bold px-2 py-1 rounded-full">
          {t('out_of_stock')}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-medium text-sm text-white leading-tight line-clamp-2">{product.name}</p>
        <p className={`font-bold mt-1 text-sm ${outOfStock ? 'text-muted' : 'text-secondary'}`}>
          R$ {Number(product.price).toFixed(2)}
        </p>
      </div>
    </button>
  )
}
