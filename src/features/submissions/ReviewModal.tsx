import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { TypeBadge } from './badges'
import {
  acceptAsTask,
  acceptExtension,
  rejectSubmission,
  type AcceptAsTaskInput,
} from './api'
import { pt } from '@/i18n/pt'
import type { Area, Member, Submission, Task } from '@/types/database'

interface TaskFormValues {
  title: string
  description: string
  area_id: string
  assignee_id: string
  due_date: string
}

export function ReviewModal({
  submission,
  open,
  onClose,
  members,
  areas,
  tasks,
  currentMemberId,
}: {
  submission: Submission | null
  open: boolean
  onClose: () => void
  members: Member[]
  areas: Area[]
  tasks: Task[]
  currentMemberId: string | null
}) {
  const qc = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [newDue, setNewDue] = useState('')

  const isExtension = !!submission?.related_task_id
  const relatedTask = submission?.related_task_id
    ? tasks.find((t) => t.id === submission.related_task_id)
    : undefined

  const { register, handleSubmit, reset } = useForm<TaskFormValues>()

  useEffect(() => {
    if (!open || !submission) return
    setRejecting(false)
    setNote('')
    setNewDue('')
    reset({
      title: submission.title,
      description: submission.description ?? '',
      area_id: '',
      assignee_id: submission.submitted_by ?? '',
      due_date: '',
    })
  }, [open, submission, reset])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['submissions'] })
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  const acceptTaskMutation = useMutation({
    mutationFn: (v: TaskFormValues) => {
      const input: AcceptAsTaskInput = {
        title: v.title,
        description: v.description || null,
        area_id: v.area_id || null,
        assignee_id: v.assignee_id || null,
        due_date: v.due_date || null,
        created_by: currentMemberId,
      }
      return acceptAsTask(submission!, input)
    },
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const acceptExtMutation = useMutation({
    mutationFn: () => acceptExtension(submission!, newDue || null),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectSubmission(submission!.id, note),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  if (!submission) return null

  const submitter = submission.submitted_by
    ? members.find((m) => m.id === submission.submitted_by)
    : undefined

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pt.approvals.reviewTitle}
      footer={
        rejecting ? (
          <>
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              {pt.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
            >
              {pt.approvals.reject}
            </Button>
          </>
        ) : (
          <>
            <Button variant="danger" onClick={() => setRejecting(true)}>
              {pt.approvals.reject}
            </Button>
            {isExtension ? (
              <Button
                onClick={() => acceptExtMutation.mutate()}
                disabled={acceptExtMutation.isPending}
              >
                {pt.approvals.acceptExtension}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit((v) => acceptTaskMutation.mutate(v))}
                disabled={acceptTaskMutation.isPending}
              >
                {pt.approvals.acceptCreate}
              </Button>
            )}
          </>
        )
      }
    >
      {/* Cabeçalho da submissão */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TypeBadge type={submission.type} />
        {submitter && (
          <span className="text-sm text-slate-500">
            {pt.approvals.from} <span className="font-medium text-slate-700">{submitter.name}</span>
          </span>
        )}
      </div>

      {rejecting ? (
        <Field label={pt.approvals.rejectNote}>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      ) : isExtension ? (
        /* Pedido de mais prazo */
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {pt.approvals.extensionFor}:{' '}
            <span className="font-medium text-slate-800">
              {relatedTask?.title ?? '—'}
            </span>
          </div>
          {submission.description && (
            <p className="whitespace-pre-wrap text-sm text-slate-600">
              {submission.description}
            </p>
          )}
          <Field label={pt.approvals.newDueDate}>
            <Input
              type="date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
            />
          </Field>
        </div>
      ) : (
        /* Aceitar → criar tarefa (com edição antes de aceitar) */
        <form className="space-y-3">
          <Field label={pt.tasks.field.title}>
            <Input {...register('title', { required: true })} />
          </Field>
          <Field label={`${pt.tasks.field.description} (${pt.common.optional})`}>
            <Textarea rows={3} {...register('description')} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={pt.tasks.field.assignee}>
              <Select {...register('assignee_id')}>
                <option value="">{pt.tasks.unassigned}</option>
                {members
                  .filter((m) => m.active)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label={pt.tasks.field.area}>
              <Select {...register('area_id')}>
                <option value="">{pt.common.none}</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={`${pt.tasks.field.dueDate} (${pt.common.optional})`}>
            <Input type="date" {...register('due_date')} />
          </Field>
        </form>
      )}
    </Modal>
  )
}
