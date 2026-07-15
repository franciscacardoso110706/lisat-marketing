import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/ui/Icon'

export interface StatCardProps {
  label: string
  hint?: string
  value: number | string
  icon: IconName
  /** Cor de acento (hex) do ícone/realce. */
  color: string
  /** Se preenchido, o cartão é um link. */
  to?: string
  /** Destaca o valor (ex: atrasadas > 0). */
  alert?: boolean
}

export function StatCard({ label, hint, value, icon, color, to, alert }: StatCardProps) {
  const inner = (
    <div className="flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition group-hover:border-brand-300 group-hover:shadow-pop">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <div
          className={`text-2xl font-bold leading-none ${
            alert ? 'text-rose-600' : 'text-slate-800'
          }`}
        >
          {value}
        </div>
        <div className="mt-1 text-sm font-medium text-slate-700">{label}</div>
        {hint && <div className="text-xs text-slate-400">{hint}</div>}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="group block">
        {inner}
      </Link>
    )
  }
  return <div className="group">{inner}</div>
}
