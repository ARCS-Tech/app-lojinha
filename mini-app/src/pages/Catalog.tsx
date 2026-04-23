import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import ProductCard from '@/components/ProductCard'
import CategoryBar from '@/components/CategoryBar'
import CartFAB from '@/components/CartFAB'
import SupportFAB from '@/components/SupportFAB'
import { t } from '@/hooks/useTranslation'

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { data: products, isLoading } = useProducts({
    categoryId: selectedCategory ?? undefined,
    search: search || undefined,
  })
  const { data: categories } = useCategories()

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-tg-bg pt-3 pb-3 px-4 space-y-3">
        <input
          type="search"
          placeholder={t('search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-tg-secondary rounded-xl text-sm outline-none"
        />
        {categories && (
          <CategoryBar categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
        )}
      </div>

      <div className="px-4">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[3/4] bg-tg-secondary rounded-2xl animate-pulse" />)}
          </div>
        )}
        {products?.length === 0 && (
          <div className="text-center py-12 text-tg-hint">
            <p className="text-4xl mb-3">🔍</p>
            <p>{t('no_products')}</p>
          </div>
        )}
        {products && products.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      <CartFAB />
      <SupportFAB />
    </div>
  )
}
