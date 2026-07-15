import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { fetchTasks, updateTaskStatus } from '@/features/tasks/api'
import { fetchAreas, fetchMembers } from '@/features/members/api'
import { TaskBoard } from '@/features/tasks/TaskBoard'
import { TaskDetailModal } from '@/features/tasks/TaskDetailModal'
import { EmptyBoard } from '@/pages/TasksPage'
import { Spinner } from '@/components/ui/Spinner'
import { pt } from '@/i18n/pt'
import type { Task, TaskStatus } from '@/types/database'

export function MyTasksPage() {
  const { member } = useAuth()
  const qc = useQueryClient()

  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })
  const areasQuery = useQuery({ queryKey: ['areas'], queryFn: fetchAreas })
  const membersQuery = useQuery({ queryKey: ['members'], queryFn: fetchMembers })

  const [detailTask, setDetailTask] = useState<Task | null>(null)

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const areas = areasQuery.data ?? []
  const members = membersQuery.data ?? []
  const tasks = tasksQuery.data ?? [] // RLS já garante que só vêm as minhas
  const loading = tasksQuery.isLoading || areasQuery.isLoading || membersQuery.isLoading

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-white">{pt.tasks.myTitle}</h1>
      <p className="mt-1 text-sm text-slate-400">{pt.tasks.subtitleMember}</p>

      <div className="mt-5">
        {loading ? (
          <Spinner />
        ) : tasks.length === 0 ? (
          <EmptyBoard text={pt.tasks.emptyBoardMember} />
        ) : (
          <TaskBoard
            tasks={tasks}
            areas={areas}
            members={members}
            showAssignee={false}
            onCardClick={setDetailTask}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          />
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
