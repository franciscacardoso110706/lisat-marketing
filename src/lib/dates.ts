import { pt } from '@/i18n/pt'

// Datas guardadas como 'YYYY-MM-DD' (sem hora). Formatação em PT-PT.

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysUntil(iso: string): number {
  const diff = parseDate(iso).getTime() - startOfToday().getTime()
  return Math.round(diff / 86_400_000)
}

export interface DueInfo {
  label: string
  /** 'overdue' | 'soon' (hoje/amanhã) | 'normal' */
  tone: 'overdue' | 'soon' | 'normal'
}

export function dueInfo(iso: string | null): DueInfo | null {
  if (!iso) return null
  const days = daysUntil(iso)
  if (days < 0) return { label: pt.due.overdue, tone: 'overdue' }
  if (days === 0) return { label: pt.due.today, tone: 'soon' }
  if (days === 1) return { label: pt.due.tomorrow, tone: 'soon' }
  return { label: formatDate(iso), tone: 'normal' }
}

export function formatDate(iso: string): string {
  return parseDate(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
