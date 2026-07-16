import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addMember,
  fetchAreas,
  fetchMembers,
  setMemberActive,
  type NewMember,
} from '@/features/members/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { Field, Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { pt } from '@/i18n/pt'
import type { Area, Member } from '@/types/database'

export function TeamPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const membersQuery = useQuery({ queryKey: ['members'], queryFn: fetchMembers })
  const areasQuery = useQuery({ queryKey: ['areas'], queryFn: fetchAreas })

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setMemberActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  })

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{pt.team.title}</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Icon name="plus" size={16} />
          {pt.team.addMember}
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {membersQuery.isLoading && <Spinner />}
        {membersQuery.isError && (
          <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-600">
            {pt.common.error}
          </p>
        )}
        {membersQuery.data?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {pt.team.emptyState}
          </p>
        )}
        {membersQuery.data?.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            onToggleActive={() => toggleActive.mutate({ id: m.id, active: !m.active })}
          />
        ))}
      </div>

      <AddMemberModal
        open={showForm}
        areas={areasQuery.data ?? []}
        onClose={() => setShowForm(false)}
      />
    </div>
  )
}

function MemberRow({
  member,
  onToggleActive,
}: {
  member: Member
  onToggleActive: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <Avatar name={member.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-800">{member.name}</span>
          <Badge>{member.role === 'leader' ? pt.roles.leader : pt.roles.member}</Badge>
          {member.area && <Badge>{member.area}</Badge>}
          {!member.active && <Badge>{pt.team.inactive}</Badge>}
        </div>
        <div className="mt-0.5 truncate text-sm text-slate-500">{member.email}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {member.auth_user_id ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {pt.team.linked}
          </span>
        ) : (
          <span className="text-xs text-slate-400">{pt.team.pending}</span>
        )}
        <button
          onClick={onToggleActive}
          className={`text-xs font-medium ${
            member.active ? 'text-slate-400 hover:text-rose-600' : 'text-emerald-600'
          }`}
        >
          {member.active ? 'Desativar' : 'Reativar'}
        </button>
      </div>
    </div>
  )
}

interface FormValues {
  name: string
  email: string
  role: 'leader' | 'member'
  area: string
  contact: string
}

function AddMemberModal({
  open,
  areas,
  onClose,
}: {
  open: boolean
  areas: Area[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { role: 'member', area: '', contact: '' } })

  const mutation = useMutation({
    mutationFn: (input: NewMember) => addMember(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
      reset()
      onClose()
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('23505')) {
        setError('email', { message: pt.team.emailInUse })
      } else {
        setError('email', { message: pt.common.error })
      }
    },
  })

  const submit = handleSubmit((v) =>
    mutation.mutate({
      name: v.name,
      email: v.email,
      role: v.role,
      area: v.area || null,
      contact: v.contact || null,
    }),
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pt.team.addMember}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {pt.common.cancel}
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? pt.common.loading : pt.common.add}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label={pt.team.name} error={errors.name?.message}>
          <Input {...register('name', { required: pt.common.required })} />
        </Field>
        <Field label={pt.team.email} error={errors.email?.message}>
          <Input type="email" {...register('email', { required: pt.common.required })} />
        </Field>
        <Field label={pt.team.role}>
          <Select {...register('role')}>
            <option value="member">{pt.roles.member}</option>
            <option value="leader">{pt.roles.leader}</option>
          </Select>
        </Field>
        <Field label={pt.team.area}>
          <Select {...register('area')}>
            <option value="">{pt.common.none}</option>
            {areas.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`${pt.team.contact} (${pt.common.optional})`} className="sm:col-span-2">
          <Input {...register('contact')} />
        </Field>
      </form>
    </Modal>
  )
}
