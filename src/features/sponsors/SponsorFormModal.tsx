import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { createSponsor, deleteSponsor, updateSponsor, type SponsorInput } from './api'
import { SPONSOR_STAGES } from './stageMeta'
import { pt } from '@/i18n/pt'
import type { Member, Sponsor, SponsorStage } from '@/types/database'

interface FormValues {
  name: string
  contact: string
  owner_id: string
  stage: SponsorStage
  next_followup_date: string
  notes: string
}

export function SponsorFormModal({
  open,
  onClose,
  sponsor,
  members,
}: {
  open: boolean
  onClose: () => void
  sponsor?: Sponsor | null
  members: Member[]
}) {
  const qc = useQueryClient()
  const editing = !!sponsor
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>()

  useEffect(() => {
    if (!open) return
    reset({
      name: sponsor?.name ?? '',
      contact: sponsor?.contact ?? '',
      owner_id: sponsor?.owner_id ?? '',
      stage: sponsor?.stage ?? 'lead',
      next_followup_date: sponsor?.next_followup_date ?? '',
      notes: sponsor?.notes ?? '',
    })
  }, [open, sponsor, reset])

  const invalidate = () => qc.invalidateQueries({ queryKey: ['sponsors'] })

  const saveMutation = useMutation({
    mutationFn: (v: FormValues) => {
      const payload: SponsorInput = {
        name: v.name,
        contact: v.contact || null,
        owner_id: v.owner_id || null,
        stage: v.stage,
        next_followup_date: v.next_followup_date || null,
        notes: v.notes || null,
      }
      if (editing && sponsor) return updateSponsor(sponsor.id, payload)
      return createSponsor(payload)
    },
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSponsor(sponsor!.id),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const submit = handleSubmit((v) => saveMutation.mutate(v))
  const activeMembers = members.filter((m) => m.active)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? pt.sponsors.editSponsor : pt.sponsors.newSponsor}
      footer={
        <>
          {editing && (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(pt.sponsors.deleteConfirm)) deleteMutation.mutate()
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
        <Field label={pt.sponsors.fieldName} error={errors.name?.message}>
          <Input autoFocus {...register('name', { required: pt.common.required })} />
        </Field>
        <Field label={`${pt.sponsors.fieldContact} (${pt.common.optional})`}>
          <Input
            placeholder="email, telefone ou pessoa de contacto"
            {...register('contact')}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={pt.sponsors.fieldOwner}>
            <Select {...register('owner_id')}>
              <option value="">{pt.sponsors.noOwner}</option>
              {activeMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={pt.sponsors.fieldStage}>
            <Select {...register('stage')}>
              {SPONSOR_STAGES.map((s) => (
                <option key={s.stage} value={s.stage}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={`${pt.sponsors.fieldFollowup} (${pt.common.optional})`}>
          <Input type="date" {...register('next_followup_date')} />
        </Field>
        <Field label={`${pt.sponsors.fieldNotes} (${pt.common.optional})`}>
          <Textarea rows={3} {...register('notes')} />
        </Field>
      </form>
    </Modal>
  )
}
