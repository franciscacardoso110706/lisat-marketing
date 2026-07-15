import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Textarea } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'
import { Icon } from '@/components/ui/Icon'
import {
  addComment,
  deleteTask,
  fetchComments,
  requestExtension,
  updateTaskStatus,
} from './api'
import { dueInfo, formatDateTime } from '@/lib/dates'
import { pt } from '@/i18n/pt'
import type { Area, Member, Role, Task, TaskStatus } from '@/types/database'

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: pt.tasks.status.todo },
  { value: 'doing', label: pt.tasks.status.doing },
  { value: 'done', label: pt.tasks.status.done },
]

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
  const [comment, setComment] = useState('')
  const [showExt, setShowExt] = useState(false)
  const [extNote, setExtNote] = useState('')
  const [extSent, setExtSent] = useState(false)

  const commentsQuery = useQuery({
    queryKey: ['comments', task?.id],
    queryFn: () => fetchComments(task!.id),
    enabled: open && !!task,
  })

  const invalidateTasks = () => qc.invalidateQueries({ queryKey: ['tasks'] })

  const statusMutation = useMutation({
    mutationFn: (status: TaskStatus) => updateTaskStatus(task!.id, status),
    onSuccess: invalidateTasks,
  })

  const commentMutation = useMutation({
    mutationFn: () => addComment(task!.id, currentMemberId!, comment),
    onSuccess: () => {
      setComment('')
      qc.invalidateQueries({ queryKey: ['comments', task?.id] })
    },
  })

  const extensionMutation = useMutation({
    mutationFn: () => requestExtension(task!, currentMemberId!, extNote),
    onSuccess: () => {
      setExtSent(true)
      setShowExt(false)
      setExtNote('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(task!.id),
    onSuccess: () => {
      invalidateTasks()
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
  const membersById = new Map(members.map((m) => [m.id, m]))
  const due = dueInfo(task.due_date)
  const isLeader = role === 'leader'

  const handleClose = () => {
    setExtSent(false)
    setShowExt(false)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
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
            <Button onClick={handleClose}>{pt.common.close}</Button>
          </>
        ) : (
          <Button onClick={handleClose}>{pt.common.close}</Button>
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

        {/* Estado */}
        <div>
          <span className="mb-1.5 block text-xs font-medium text-slate-500">
            {pt.tasks.moveTo}
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => statusMutation.mutate(s.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  task.status === s.value
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Membro: pedir mais prazo */}
        {!isLeader && (
          <div>
            {extSent ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {pt.tasks.extensionSent}
              </p>
            ) : showExt ? (
              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                <Textarea
                  rows={2}
                  value={extNote}
                  onChange={(e) => setExtNote(e.target.value)}
                  placeholder={pt.tasks.extensionPlaceholder}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowExt(false)}>
                    {pt.common.cancel}
                  </Button>
                  <Button
                    onClick={() => extensionMutation.mutate()}
                    disabled={extensionMutation.isPending}
                  >
                    {pt.common.confirm}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setShowExt(true)}>
                <Icon name="clock" size={16} />
                {pt.tasks.requestExtension}
              </Button>
            )}
          </div>
        )}

        {/* Comentários */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {pt.tasks.comments}
          </h3>
          {commentsQuery.isLoading && <Spinner />}
          <div className="space-y-2">
            {commentsQuery.data?.length === 0 && (
              <p className="text-sm text-slate-400">{pt.tasks.noComments}</p>
            )}
            {commentsQuery.data?.map((c) => {
              const author = c.author_id ? membersById.get(c.author_id) : undefined
              return (
                <div key={c.id} className="flex gap-2">
                  <Avatar name={author?.name ?? '?'} size="sm" />
                  <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700">
                        {author?.name ?? '—'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(c.created_at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-600">{c.body}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <Textarea
              rows={1}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={pt.tasks.commentPlaceholder}
            />
            <Button
              onClick={() => commentMutation.mutate()}
              disabled={!comment.trim() || commentMutation.isPending}
            >
              {pt.tasks.addComment}
            </Button>
          </div>
        </div>

        {creator && (
          <p className="text-[11px] text-slate-400">
            {pt.tasks.createdBy} {creator.name} · {formatDateTime(task.created_at)}
          </p>
        )}
      </div>
    </Modal>
  )
}
