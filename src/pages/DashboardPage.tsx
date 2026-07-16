import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { visibleNavItems } from '@/components/nav'
import { Icon } from '@/components/ui/Icon'
import { StatCard } from '@/features/dashboard/StatCard'
import { fetchTasks } from '@/features/tasks/api'
import { fetchSponsors } from '@/features/sponsors/api'
import { countPendingAttachments } from '@/features/attachments/api'
import { daysUntil } from '@/lib/dates'
import { pt } from '@/i18n/pt'

export function DashboardPage() {
  const { member } = useAuth()
  if (!member) return null
  const isLeader = member.role === 'leader'
  const shortcuts = visibleNavItems(member).filter((i) => i.to !== '/')

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-100">
            {isLeader ? pt.roles.leader : pt.roles.member} · LISAT Marketing
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            {pt.dashboard.welcome}, {member.name.split(' ')[0]}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-brand-100">
            {isLeader ? pt.dashboard.leaderIntro : pt.dashboard.memberIntro}
          </p>
        </div>
      </div>

      {isLeader && <LeaderStats />}

      {/* Atalhos */}
      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {pt.dashboard.shortcuts}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shortcuts.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
              <Icon name={item.icon} size={20} />
            </span>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-brand-700">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function LeaderStats() {
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })
  const sponsorsQuery = useQuery({ queryKey: ['sponsors'], queryFn: fetchSponsors })
  const pendingQuery = useQuery({
    queryKey: ['attachments', 'pending-count'],
    queryFn: countPendingAttachments,
  })

  const overdue = (tasksQuery.data ?? []).filter(
    (t) => t.status !== 'done' && t.due_date && daysUntil(t.due_date) < 0,
  ).length

  const followups = (sponsorsQuery.data ?? []).filter((s) => {
    if (!s.next_followup_date) return false
    if (s.stage === 'fechado' || s.stage === 'perdido') return false
    const d = daysUntil(s.next_followup_date)
    return d >= 0 && d <= 7
  }).length

  const pending = pendingQuery.data ?? 0

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <StatCard
        label={pt.dashboard.stats.overdue}
        hint={pt.dashboard.stats.overdueHint}
        value={overdue}
        icon="alert"
        color="#e11d48"
        to="/tarefas"
        alert={overdue > 0}
      />
      <StatCard
        label={pt.dashboard.stats.pending}
        hint={pt.dashboard.stats.pendingHint}
        value={pending}
        icon="approvals"
        color="#2563eb"
        to="/aprovacoes"
      />
      <StatCard
        label={pt.dashboard.stats.followups}
        hint={pt.dashboard.stats.followupsHint}
        value={followups}
        icon="sponsors"
        color="#d97706"
        to="/sponsors"
      />
    </div>
  )
}
