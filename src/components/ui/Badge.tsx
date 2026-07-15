import type { ReactNode } from 'react'

export function Badge({
  children,
  color,
  className = '',
}: {
  children: ReactNode
  /** Cor de acento (hex). Se omitida, usa neutro. */
  color?: string
  className?: string
}) {
  if (color) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
        style={{ backgroundColor: `${color}1a`, color }}
      >
        {children}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ${className}`}
    >
      {children}
    </span>
  )
}
