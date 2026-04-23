import { t } from '@/hooks/useTranslation'

const STATUS_KEYS: Record<string, 'status_submitted' | 'status_in_review' | 'status_confirmed' | 'status_cancelled'> = {
  submitted: 'status_submitted',
  in_review: 'status_in_review',
  confirmed: 'status_confirmed',
  cancelled: 'status_cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-amber-500/15 text-amber-400',
  in_review: 'bg-blue-500/15 text-blue-400',
  confirmed: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-red-500/15 text-red-400',
}

export default function StatusBadge({ status }: { status: string }) {
  const key = STATUS_KEYS[status]
  const label = key ? t(key) : status
  const color = STATUS_COLORS[status] ?? 'bg-surface-2 text-muted'
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>
}
