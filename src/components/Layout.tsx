import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { visibleNavItems } from '@/components/nav'
import { countPendingAttachments } from '@/features/attachments/api'
import { pt } from '@/i18n/pt'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-white/30">
        <img src="/logo.svg" alt="LISAT" className="h-full w-full object-contain p-0.5" />
      </span>
      <div className="leading-tight">
        <div className="text-sm font-extrabold tracking-tight text-white">LISAT</div>
        <div className="text-[11px] font-medium text-brand-100">Marketing</div>
      </div>
    </div>
  )
}

export function Layout() {
  const { member, signOut } = useAuth()
  const isLeader = member?.role === 'leader'
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const pendingQuery = useQuery({
    queryKey: ['attachments', 'pending-count'],
    queryFn: countPendingAttachments,
    enabled: isLeader,
    refetchInterval: 60_000,
  })

  // Fechar o painel do telemóvel ao mudar de página ou com Esc
  useEffect(() => setMenuOpen(false), [location.pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  if (!member) return null
  const items = visibleNavItems(member)
  const pending = pendingQuery.data ?? 0
  const badgeFor = (to: string) => (to === '/aprovacoes' ? pending : 0)

  return (
    <div className="app-bg min-h-screen md:flex">
      {/* Sidebar azul (desktop) */}
      <aside className="sidebar-bg hidden w-64 shrink-0 flex-col md:flex">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-brand-100/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon name={item.icon} size={18} />
              {item.label}
              {badgeFor(item.to) > 0 && (
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-700">
                  {badgeFor(item.to)}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <UserBox onSignOut={signOut} name={member.name} role={member.role} />
      </aside>

      {/* Conteúdo */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Header (telemóvel) */}
        <header className="sidebar-bg sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:hidden">
          <Brand />
          <button
            onClick={signOut}
            aria-label={pt.common.signOut}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-100 hover:bg-white/10 hover:text-white"
          >
            <Icon name="logout" size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-28 md:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ---- Navegação do telemóvel: bola-casa + painel de quadrados ---- */}
      <MobileNav
        items={items}
        open={menuOpen}
        onToggle={() => setMenuOpen((o) => !o)}
        onClose={() => setMenuOpen(false)}
        badgeFor={badgeFor}
        hasPending={pending > 0}
      />
    </div>
  )
}

function MobileNav({
  items,
  open,
  onToggle,
  onClose,
  badgeFor,
  hasPending,
}: {
  items: ReturnType<typeof visibleNavItems>
  open: boolean
  onToggle: () => void
  onClose: () => void
  badgeFor: (to: string) => number
  hasPending: boolean
}) {
  return (
    <div className="md:hidden">
      {/* Fundo escurecido */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Painel que sobe */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-slate-200 bg-white px-4 pb-24 pt-3 shadow-pop transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300" />
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const badge = badgeFor(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${
                    isActive
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-brand-600 ring-1 ring-inset ring-brand-100"
                  aria-hidden
                >
                  <Icon name={item.icon} size={20} />
                </span>
                <span className="text-xs font-medium leading-tight">{item.label}</span>
                {badge > 0 && (
                  <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>
      </div>

      {/* Bola central com casa (abre/fecha o painel) */}
      <button
        onClick={onToggle}
        aria-label="Menu"
        aria-expanded={open}
        className="fixed bottom-5 left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg ring-4 ring-white transition active:scale-95"
      >
        <Icon name={open ? 'close' : 'home'} size={24} />
        {!open && hasPending && (
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>
    </div>
  )
}

function UserBox({
  name,
  role,
  onSignOut,
}: {
  name: string
  role: 'leader' | 'member'
  onSignOut: () => void
}) {
  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{name}</div>
          <div className="text-xs text-brand-200">
            {role === 'leader' ? pt.roles.leader : pt.roles.member}
          </div>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-100/80 hover:bg-white/10 hover:text-white"
      >
        <Icon name="logout" size={16} />
        {pt.common.signOut}
      </button>
    </div>
  )
}
