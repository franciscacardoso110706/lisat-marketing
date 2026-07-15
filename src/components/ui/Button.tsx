import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  block?: boolean
}

const styles: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-sm',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-brand-500',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-brand-500',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
}

export function Button({
  variant = 'primary',
  block = false,
  className = '',
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:cursor-not-allowed disabled:opacity-50
        ${styles[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...props}
    />
  )
}
