import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { deleteTask } from './api'
import { AttachmentSection } from '@/features/attachments/AttachmentSection'
import { dueInfo, formatDateTime } from '@/lib/dates'
import { pt } from '@/i18n/pt'
import type { Area, Member, Role, Task } from '@/types/database'

const dueChip: Record<string, string> = {
  overdue: 'bg-rose-50 text-rose-600',
  soon: 'bg-amber-50 text-amber-600',
  normal: 'bg-slate-100 text-slate-500',
}

export function TaskDetailModal({
  task,
  open,
  onClose,
  onEdit,
  areas,
  members,
  role,
  currentMemberId,
}: {
  task: Task | null
  open: boolean
  onClose: () => void
  onEdit: (task: Task) => void
  areas: Area[]
  members: Member[]
  role: Role
  currentMemberId: string | null
}) {
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(task!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
  })

  if (!task) return null

  const area = task.area_id ? areas.find((a) => a.id === task.area_id) : undefined
  const assignee = task.assignee_id
    ? members.find((m) => m.id === task.assignee_id)
    : undefined
  const creator = task.created_by
    ? members.find((m) => m.id === task.created_by)
    : undefined
  const due = dueInfo(task.due_date)
  const isLeader = role === 'leader'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task.title}
      footer={
        isLeader ? (
          <>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(pt.tasks.deleteConfirm)) deleteMutation.mutate()
              }}
              disabled={deleteMutation.isPending}
            >
              <Icon name="trash" size={16} />
              {pt.common.remove}
            </Button>
            <Button variant="secondary" onClick={() => onEdit(task)}>
              <Icon name="edit" size={16} />
              {pt.common.edit}
            </Button>
            <Button onClick={onClose}>{pt.common.close}</Button>
          </>
        ) : (
          <Button onClick={onClose}>{pt.common.close}</Button>
        )
      }
    >
      <div className="space-y-4">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2">
          {area && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${area.color}26`, color: area.color }}
            >
              {area.name}
            </span>
          )}
          {due && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${dueChip[due.tone]}`}
            >
              {due.label}
            </span>
          )}
          {assignee && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-slate-600">
              <Avatar name={assignee.name} size="sm" />
              {assignee.name}
            </span>
          )}
        </div>

        {task.description && (
          <p className="whitespace-pre-wrap text-sm text-slate-600">{task.description}</p>
        )}

        {/* Entregáveis (ficheiros) */}
        <AttachmentSection
          task={task}
          members={members}
          currentMemberId={currentMemberId}
          isLeader={isLeader}
        />

        {creator && (
          <p className="text-[11px] text-slate-400">
            {pt.tasks.createdBy} {creator.name} · {formatDateTime(task.created_at)}
          </p>
        )}
      </div>
    </Modal>
  )
}
