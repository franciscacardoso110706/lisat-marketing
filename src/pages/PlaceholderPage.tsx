import { pt } from '@/i18n/pt'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        {pt.placeholder.comingSoon}
      </div>
    </div>
  )
}
