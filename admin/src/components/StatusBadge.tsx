const STATUS_MAP: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Enviado', color: 'bg-yellow-100 text-yellow-700' },
  in_review: { label: 'Em análise', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, color: 'bg-gray-100 text-gray-500' }
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
}
