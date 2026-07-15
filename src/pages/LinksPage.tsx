import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import {
  createLink,
  deleteLink,
  fetchLinks,
  normalizeUrl,
  prettyHost,
  updateLink,
  type LinkInput,
} from '@/features/links/api'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { pt } from '@/i18n/pt'
import type { LinkItem } from '@/types/database'

export function LinksPage() {
  const { member } = useAuth()
  const isLeader = member?.role === 'leader'

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LinkItem | null>(null)

  const linksQuery = useQuery({ queryKey: ['links'], queryFn: fetchLinks })

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (l: LinkItem) => {
    setEditing(l)
    setFormOpen(true)
  }

  const links = linksQuery.data ?? []

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{pt.links.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLeader ? pt.links.subtitleLeader : pt.links.subtitleMember}
          </p>
        </div>
        {isLeader && (
          <Button onClick={openNew}>
            <Icon name="plus" size={16} />
            {pt.links.add}
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {linksQuery.isLoading && <Spinner />}
        {!linksQuery.isLoading && links.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 sm:col-span-2">
            {isLeader ? pt.links.empty : pt.links.emptyMember}
          </p>
        )}
        {links.map((l) => (
          <LinkCard key={l.id} link={l} isLeader={isLeader} onEdit={() => openEdit(l)} />
        ))}
      </div>

      {isLeader && (
        <LinkFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          link={editing}
          createdBy={member?.id ?? null}
        />
      )}
    </div>
  )
}

function LinkCard({
  link,
  isLeader,
  onEdit,
}: {
  link: LinkItem
  isLeader: boolean
  onEdit: () => void
}) {
  return (
    <div className="group relative flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-pop">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon name="links" size={18} />
      </span>
      <a
        href={normalizeUrl(link.url)}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1"
      >
        <div className="truncate font-semibold text-slate-800 group-hover:text-brand-700">
          {link.title}
        </div>
        <div className="truncate text-xs text-brand-600">{prettyHost(link.url)}</div>
        {link.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{link.description}</p>
        )}
      </a>
      {isLeader && (
        <button
          onClick={onEdit}
          aria-label={pt.links.edit}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
        >
          <Icon name="edit" size={16} />
        </button>
      )}
    </div>
  )
}

interface FormValues {
  title: string
  url: string
  description: string
}

function LinkFormModal({
  open,
  onClose,
  link,
  createdBy,
}: {
  open: boolean
  onClose: () => void
  link: LinkItem | null
  createdBy: string | null
}) {
  const qc = useQueryClient()
  const editing = !!link
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>()

  useEffect(() => {
    if (!open) return
    reset({
      title: link?.title ?? '',
      url: link?.url ?? '',
      description: link?.description ?? '',
    })
  }, [open, link, reset])

  const invalidate = () => qc.invalidateQueries({ queryKey: ['links'] })

  const saveMutation = useMutation({
    mutationFn: (v: FormValues) => {
      const payload = { title: v.title, url: v.url, description: v.description || null }
      if (editing && link) return updateLink(link.id, payload)
      return createLink({ ...payload, created_by: createdBy } as LinkInput)
    },
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteLink(link!.id),
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
      title={editing ? pt.links.edit : pt.links.add}
      footer={
        <>
          {editing && (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(pt.links.deleteConfirm)) deleteMutation.mutate()
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
        <Field label={pt.links.fieldTitle} error={errors.title?.message}>
          <Input autoFocus {...register('title', { required: pt.common.required })} />
        </Field>
        <Field label={pt.links.fieldUrl} error={errors.url?.message}>
          <Input
            placeholder="drive.google.com/…"
            {...register('url', { required: pt.common.required })}
          />
        </Field>
        <Field label={`${pt.links.fieldDescription} (${pt.common.optional})`}>
          <Textarea rows={2} {...register('description')} />
        </Field>
      </form>
    </Modal>
  )
}
