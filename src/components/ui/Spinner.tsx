import { pt } from '@/i18n/pt'

export function Spinner({ label = pt.common.loading }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-8 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="app-bg flex min-h-screen items-center justify-center">
      <Spinner label={label} />
    </div>
  )
}
