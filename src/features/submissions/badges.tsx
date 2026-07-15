import { pt } from '@/i18n/pt'
import type { SubmissionStatus, SubmissionType } from '@/types/database'

const typeColor: Record<SubmissionType, string> = {
  ideia: '#8b5cf6',
  pedido: '#0ea5e9',
  impedimento: '#f43f5e',
  outro: '#64748b',
}

export function TypeBadge({ type }: { type: SubmissionType }) {
  const color = typeColor[type]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {pt.submissionTypes[type]}
    </span>
  )
}

const statusCls: Record<SubmissionStatus, string> = {
  pending: 'bg-amber-50 text-amber-600',
  accepted: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-rose-50 text-rose-600',
}

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCls[status]}`}
    >
      {pt.submissionStatus[status]}
    </span>
  )
}
