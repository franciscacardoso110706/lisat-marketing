import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { fetchTasks } from '@/features/tasks/api'
import { fetchAreas, fetchMembers } from '@/features/members/api'
import { fetchVisibleAttachments } from '@/features/attachments/api'
import { TaskDetailModal } from '@/features/tasks/TaskDetailModal'
import { Spinner } from '@/components/ui/Spinner'
import { Icon } from '@/components/ui/Icon'
import { pt } from '@/i18n/pt'
import type { AttachmentStatus, Task } from '@/types/database'

// Estado de entrega agregado por tarefa (a partir dos anexos)
type Delivery = 'none' | 'approved' | 'pending' | 'rejected'

function deliveryOf(statuses: AttachmentStatus[]): Delivery {
  if (statuses.length === 0) return 'none'
  if (statuses.includes('approved')) return 'approved'
  if (statuses.includes('pending')) return 'pending'
  return 'rejected'
}

const deliveryMeta: Record<Delivery, { label: string; cls: string }> = {
  none: { label: pt.entregas.none, cls: 'bg-slate-100 text-slate-500' },
  approved: { label: pt.entregas.delivered, cls: 'bg-emerald-50 text-emerald-600' },
  pending: { label: pt.entregas.pendingReview, cls: 'bg-amber-50 text-amber-600' },
  rejected: { label: pt.entregas.rejected, cls: 'bg-rose-50 text-rose-600' },
}

export function EntregasPage() {
  const { member } = useAuth()
  const [detailTask, setDetailTask] = useState<Task | null>(null)

  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })
  const areasQuery = useQuery({ queryKey: ['areas'], queryFn: fetchAreas })
  const membersQuery = useQuery({ queryKey: ['members'], queryFn: fetchMembers })
  const attsQuery = useQuery({
    queryKey: ['attachments', 'mine'],
    queryFn: fetchVisibleAttachments,
  })

  const areas = areasQuery.data ?? []
  const members = membersQuery.data ?? []

  const deliveryByTask = useMemo(() => {
    const map = new Map<string, AttachmentStatus[]>()
    for (const a of attsQuery.data ?? []) {
      const arr = map.get(a.task_id) ?? []
      arr.push(a.status)
      map.set(a.task_id, arr)
    }
    return map
  }, [attsQuery.data])

  // As minhas tarefas (RLS já filtra), por concluir primeiro
  const tasks = useMemo(() => {
    const list = [...(tasksQuery.data ?? [])]
    const rank = (t: Task) => (t.status === 'done' ? 1 : 0)
    return list.sort((a, b) => rank(a) - rank(b))
  }, [tasksQuery.data])

  const loading =
    tasksQuery.isLoading || areasQuery.isLoading || membersQuery.isLoading

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">{pt.entregas.title}</h1>

      <div className="mt-6 space-y-2">
        {loading ? (
          <Spinner />
        ) : tasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {pt.entregas.empty}
          </p>
        ) : (
          tasks.map((task) => {
            const area = task.area_id ? areas.find((a) => a.id === task.area_id) : undefined
            const delivery = deliveryOf(deliveryByTask.get(task.id) ?? [])
            const meta = deliveryMeta[delivery]
            return (
              <button
                key={task.id}
                onClick={() => setDetailTask(task)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:border-brand-300"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name="paperclip" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-800">{task.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {area && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: `${area.color}1a`, color: area.color }}
                      >
                        {area.name}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
                <Icon name="chevron-down" size={18} className="-rotate-90 text-slate-300" />
              </button>
            )
          })
        )}
      </div>

      <TaskDetailModal
        task={detailTask}
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
        onEdit={() => {}}
        areas={areas}
        members={members}
        role="member"
        currentMemberId={member?.id ?? null}
      />
    </div>
  )
}
