import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { createEvent, deleteEvent, updateEvent } from './api'
import { eventMeta, EVENT_TYPE_ORDER } from './eventMeta'
import { pt } from '@/i18n/pt'
import type { CalendarEvent, EventType } from '@/types/database'

interface FormValues {
  title: string
  type: EventType
  start_date: string
  end_date: string
  description: string
}

export function EventFormModal({
  open,
  onClose,
  event,
  defaultDate,
  createdBy,
}: {
  open: boolean
  onClose: () => void
  event?: CalendarEvent | null
  defaultDate: string
  createdBy: string | null
}) {
  const qc = useQueryClient()
  const editing = !!event
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>()

  useEffect(() => {
    if (!open) return
    reset({
      title: event?.title ?? '',
      type: event?.type ?? 'conteudo',
      start_date: event?.start_date ?? defaultDate,
      end_date: event?.end_date ?? '',
      description: event?.description ?? '',
    })
  }, [open, event, defaultDate, reset])

  const invalidate = () => qc.invalidateQueries({ queryKey: ['events'] })

  const saveMutation = useMutation({
    mutationFn: (v: FormValues) => {
      const payload = {
        title: v.title,
        type: v.type,
        start_date: v.start_date,
        end_date: v.end_date || null,
        description: v.description || null,
      }
      if (editing && event) return updateEvent(event.id, payload)
      return createEvent({ ...payload, created_by: createdBy })
    },
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(event!.id),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const submit = handleSubmit((v) => saveMutation.mutate(v))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? pt.calendar.editEvent : pt.calendar.newEvent}
      footer={
        <>
          {editing && (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(pt.calendar.deleteConfirm)) deleteMutation.mutate()
              }}
              disabled={deleteMutation.isPending}
            >
              <Icon name="trash" size={16} />
              {pt.common.remove}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {pt.common.cancel}
          </Button>
          <Button onClick={submit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? pt.common.loading : pt.common.save}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Field label={pt.calendar.fieldTitle} error={errors.title?.message}>
          <Input autoFocus {...register('title', { required: pt.common.required })} />
        </Field>
        <Field label={pt.calendar.fieldType}>
          <Select {...register('type')}>
            {EVENT_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {eventMeta[t].label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={pt.calendar.fieldStart} error={errors.start_date?.message}>
            <Input type="date" {...register('start_date', { required: true })} />
          </Field>
          <Field label={`${pt.calendar.fieldEnd} ${pt.calendar.fieldEndHint}`}>
            <Input type="date" {...register('end_date')} />
          </Field>
        </div>
        <Field label={`${pt.calendar.fieldDescription} (${pt.common.optional})`}>
          <Textarea rows={2} {...register('description')} />
        </Field>
      </form>
    </Modal>
  )
}
