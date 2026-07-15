import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import {
  createSubmission,
  fetchSubmissions,
  type NewSubmission,
} from '@/features/submissions/api'
import { StatusBadge, TypeBadge } from '@/features/submissions/badges'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'
import { Icon } from '@/components/ui/Icon'
import { formatDateTime } from '@/lib/dates'
import { pt } from '@/i18n/pt'
import type { SubmissionType } from '@/types/database'

interface FormValues {
  title: string
  type: SubmissionType
  description: string
}

export function SubmitPage() {
  const { member } = useAuth()
  const qc = useQueryClient()

  const mineQuery = useQuery({
    queryKey: ['submissions', 'mine'],
    queryFn: () => fetchSubmissions(),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<FormValues>({ defaultValues: { type: 'ideia' } })

  const mutation = useMutation({
    mutationFn: (input: NewSubmission) => createSubmission(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] })
      reset({ title: '', type: 'ideia', description: '' })
    },
  })

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">{pt.submit.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{pt.submit.subtitle}</p>

      {/* Banner de confirmação */}
      {isSubmitSuccessful && !mutation.isPending && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Icon name="check" size={18} />
          {pt.submit.sent}
        </div>
      )}

      {/* Formulário */}
      <form
        onSubmit={handleSubmit((v) =>
          mutation.mutate({
            title: v.title,
            description: v.description || null,
            type: v.type,
            submitted_by: member?.id ?? null,
          }),
        )}
        className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label={pt.submit.fieldTitle}
            error={errors.title?.message}
            className="sm:col-span-2"
          >
            <Input
              placeholder="Ex: Fazer post para o lançamento"
              {...register('title', { required: pt.common.required })}
            />
          </Field>
          <Field label={pt.submit.fieldType}>
            <Select {...register('type')}>
              <option value="ideia">{pt.submissionTypes.ideia}</option>
              <option value="pedido">{pt.submissionTypes.pedido}</option>
              <option value="impedimento">{pt.submissionTypes.impedimento}</option>
              <option value="outro">{pt.submissionTypes.outro}</option>
            </Select>
          </Field>
        </div>
        <Field label={`${pt.submit.fieldDescription} (${pt.common.optional})`}>
          <Textarea rows={3} {...register('description')} />
        </Field>
        <div className="flex items-center justify-end gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? pt.common.loading : pt.submit.send}
          </Button>
        </div>
      </form>

      {/* As minhas submissões */}
      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {pt.submit.mine}
      </h2>
      <div className="space-y-2">
        {mineQuery.isLoading && <Spinner />}
        {mineQuery.data?.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {pt.submit.emptyMine}
          </p>
        )}
        {mineQuery.data?.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-800">{s.title}</span>
              <TypeBadge type={s.type} />
              <StatusBadge status={s.status} />
              <span className="ml-auto text-xs text-slate-400">
                {formatDateTime(s.created_at)}
              </span>
            </div>
            {s.description && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                {s.description}
              </p>
            )}
            {s.status === 'rejected' && s.leader_note && (
              <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {s.leader_note}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
