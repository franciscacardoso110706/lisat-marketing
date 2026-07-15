// Avatar com iniciais e cor derivada do nome (consistente para a mesma pessoa).

const palette = [
  '#4f46e5', '#0ea5e9', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#db2777', '#0891b2', '#65a30d', '#ea580c',
]

function colorFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const sizes = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
}

export function Avatar({
  name,
  size = 'md',
}: {
  name: string
  size?: keyof typeof sizes
}) {
  const color = colorFor(name)
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${sizes[size]}`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials(name)}
    </span>
  )
}
