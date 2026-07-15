import { pt } from '@/i18n/pt'
import type { IconName } from '@/components/ui/Icon'
import type { Member } from '@/types/database'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  /** Decide se o item aparece para este membro. */
  show: (m: Member) => boolean
}

const isLeader = (m: Member) => m.role === 'leader'
const isMember = (m: Member) => m.role === 'member'
const isSponsorArea = (m: Member) => (m.area ?? '').toLowerCase() === 'sponsors'

export const navItems: NavItem[] = [
  { to: '/', label: pt.nav.dashboard, icon: 'home', show: () => true },
  { to: '/tarefas', label: pt.nav.tasks, icon: 'tasks', show: isLeader },
  { to: '/minhas-tarefas', label: pt.nav.myTasks, icon: 'my-tasks', show: isMember },
  { to: '/aprovacoes', label: pt.nav.approvals, icon: 'approvals', show: isLeader },
  { to: '/submeter', label: pt.nav.submit, icon: 'submit', show: isMember },
  { to: '/calendario', label: pt.nav.calendar, icon: 'calendar', show: () => true },
  { to: '/links', label: pt.nav.links, icon: 'links', show: () => true },
  {
    to: '/sponsors',
    label: pt.nav.sponsors,
    icon: 'sponsors',
    show: (m) => isLeader(m) || isSponsorArea(m),
  },
  { to: '/equipa', label: pt.nav.team, icon: 'team', show: isLeader },
]

export function visibleNavItems(member: Member): NavItem[] {
  return navItems.filter((item) => item.show(member))
}
