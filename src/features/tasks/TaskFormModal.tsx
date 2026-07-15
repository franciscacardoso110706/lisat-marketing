import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { createTask, updateTask } from './api'
import { pt } from '@/i18n/pt'
import type { Area, Member, Task } from '@/types/database'

interface FormValues {
  title: string
  description: string
  area_id: string
  assignee_id: string
  due_date: string
}

export function TaskFormModal({
  open,
  onClose,
  task,
  areas,
  members,
  createdBy,
}: {
  open: boolean
  onClose: () => void
  /** Se fornecida, o modal está em modo edição. */
  task?: Task | null
  areas: Area[]
  members: Member[]
  createdBy: string | null
}) {
  const qc = useQueryClient()
  const editing = !!task
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>()

  useEffect(() => {
    if (!open) return
    reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      area_id: task?.area_id ?? '',
      assignee_id: task?.assignee_id ?? '',
      due_date: task?.due_date ?? '',
    })
  }, [open, task, reset])

  const mutation = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload = {
        title: v.title,
        description: v.description || null,
        area_id: v.area_id || null,
        assignee_id: v.assignee_id || null,
        due_date: v.due_date || null,
      }
      if (editing && task) await updateTask(task.id, payload)
      else await createTask({ ...payload, created_by: createdBy })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
  })

  const submit = handleSubmit((v) => mutation.mutate(v))
  const activeMembers = members.filter((m) => m.active)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? pt.tasks.editTask : pt.tasks.newTask}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {pt.common.cancel}
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? pt.common.loading : pt.common.save}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Field label={pt.tasks.field.title} error={errors.title?.message}>
          <Input autoFocus {...register('title', { required: pt.common.required })} />
        </Field>
        <Field label={`${pt.tasks.field.description} (${pt.common.optional})`}>
          <Textarea rows={3} {...register('description')} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={pt.tasks.field.assignee}>
            <Select {...register('assignee_id')}>
              <option value="">{pt.tasks.unassigned}</option>
              {activeMembers.map((m) => (
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
    </Modal>
  )
}
