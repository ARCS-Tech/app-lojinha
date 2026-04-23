import type { Category } from '@/hooks/useCategories'
import { t } from '@/hooks/useTranslation'

interface Props { categories: Category[]; selected: string | null; onSelect: (id: string | null) => void }

export default function CategoryBar({ categories, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      <button
        onClick={() => onSelect(null)}
        className={`flex-none px-4 py-2 rounded-full text-sm font-medium transition-colors ${selected === null ? 'bg-tg-button text-tg-button-text' : 'bg-tg-secondary text-tg-text'}`}
      >
        {t('all_categories')}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex-none px-4 py-2 rounded-full text-sm font-medium transition-colors ${selected === cat.id ? 'bg-tg-button text-tg-button-text' : 'bg-tg-secondary text-tg-text'}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
