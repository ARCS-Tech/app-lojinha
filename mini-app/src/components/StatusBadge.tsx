import { t } from '@/hooks/useTranslation'

const STATUS_KEYS: Record<string, 'status_submitted' | 'status_in_review' | 'status_confirmed' | 'status_cancelled'> = {
  submitted: 'status_submitted',
  in_review: 'status_in_review',
  confirmed: 'status_confirmed',
  cancelled: 'status_cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status }: { status: string }) {
  const key = STATUS_KEYS[status]
  const label = key ? t(key) : status
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>
}
