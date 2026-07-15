import { NavLink, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { visibleNavItems } from '@/components/nav'
import { countPendingSubmissions } from '@/features/submissions/api'
import { pt } from '@/i18n/pt'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
        <Icon name="satellite" size={20} />
      </span>
      <div className="leading-tight">
        <div className="text-sm font-extrabold tracking-tight text-white">LISAT</div>
        <div className="text-[11px] font-medium text-brand-200">Marketing</div>
      </div>
    </div>
  )
}

export function Layout() {
  const { member, signOut } = useAuth()
  const isLeader = member?.role === 'leader'
  const pendingQuery = useQuery({
    queryKey: ['submissions', 'pending-count'],
    queryFn: countPendingSubmissions,
    enabled: isLeader,
    refetchInterval: 60_000,
  })
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

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          <Outlet />
        </main>

        {/* Tab bar (telemóvel) */}
        <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  isActive ? 'text-brand-700' : 'text-slate-500'
                }`
              }
            >
              <span className="relative">
                <Icon name={item.icon} size={20} />
                {badgeFor(item.to) > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                    {badgeFor(item.to)}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
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
