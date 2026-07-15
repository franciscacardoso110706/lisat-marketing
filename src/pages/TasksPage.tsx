import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { fetchTasks, updateTaskStatus } from '@/features/tasks/api'
import { fetchAreas, fetchMembers } from '@/features/members/api'
import { TaskBoard } from '@/features/tasks/TaskBoard'
import { TaskFormModal } from '@/features/tasks/TaskFormModal'
import { TaskDetailModal } from '@/features/tasks/TaskDetailModal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'
import { Icon } from '@/components/ui/Icon'
import { pt } from '@/i18n/pt'
import type { Task, TaskStatus } from '@/types/database'

export function TasksPage() {
  const { member } = useAuth()
  const qc = useQueryClient()

  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })
  const areasQuery = useQuery({ queryKey: ['areas'], queryFn: fetchAreas })
  const membersQuery = useQuery({ queryKey: ['members'], queryFn: fetchMembers })

  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const areas = areasQuery.data ?? []
  const members = membersQuery.data ?? []

  const filtered = useMemo(() => {
    let list = tasksQuery.data ?? []
    if (assigneeFilter === 'none') list = list.filter((t) => !t.assignee_id)
    else if (assigneeFilter) list = list.filter((t) => t.assignee_id === assigneeFilter)
    if (areaFilter) list = list.filter((t) => t.area_id === areaFilter)
    return list
  }, [tasksQuery.data, assigneeFilter, areaFilter])

  const loading = tasksQuery.isLoading || areasQuery.isLoading || membersQuery.isLoading
  const isEmpty = !loading && (tasksQuery.data?.length ?? 0) === 0

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{pt.tasks.title}</h1>
          <p className="mt-1 text-sm text-slate-400">{pt.tasks.subtitleLeader}</p>
        </div>
        <Button
          onClick={() => {
            setEditTask(null)
            setShowForm(true)
          }}
        >
          <Icon name="plus" size={16} />
          {pt.tasks.newTask}
        </Button>
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Select
          className="w-auto"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">{pt.tasks.allPeople}</option>
          <option value="none">{pt.tasks.unassigned}</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
        >
          <option value="">{pt.tasks.allAreas}</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-5">
        {loading ? (
          <Spinner />
        ) : isEmpty ? (
          <EmptyBoard text={pt.tasks.emptyBoardLeader} />
        ) : (
          <TaskBoard
            tasks={filtered}
            areas={areas}
            members={members}
            showAssignee
            onCardClick={setDetailTask}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          />
        )}
      </div>

      <TaskFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        task={editTask}
        areas={areas}
        members={members}
        createdBy={member?.id ?? null}
      />

      <TaskDetailModal
        task={detailTask}
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
        onEdit={(t) => {
          setDetailTask(null)
          setEditTask(t)
          setShowForm(true)
        }}
        areas={areas}
        members={members}
        role="leader"
        currentMemberId={member?.id ?? null}
      />
    </div>
  )
}

export function EmptyBoard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
      {text}
    </div>
  )
}
