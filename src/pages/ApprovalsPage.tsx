import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveAttachment,
  fetchPendingAttachments,
  rejectAttachment,
  type PendingAttachment,
} from '@/features/attachments/api'
import { AttachmentThumb } from '@/features/attachments/AttachmentThumb'
import { fetchMembers } from '@/features/members/api'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Icon } from '@/components/ui/Icon'
import { formatDateTime } from '@/lib/dates'
import { pt } from '@/i18n/pt'
import type { Member } from '@/types/database'

export function ApprovalsPage() {
  const qc = useQueryClient()

  const pendingQuery = useQuery({
    queryKey: ['attachments', 'pending'],
    queryFn: fetchPendingAttachments,
  })
  const membersQuery = useQuery({ queryKey: ['members'], queryFn: fetchMembers })
  const membersById = useMemo(
    () => new Map((membersQuery.data ?? []).map((m) => [m.id, m])),
    [membersQuery.data],
  )

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['attachments'] })
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  const approveMut = useMutation({
    mutationFn: ({ id, taskId }: { id: string; taskId: string }) =>
      approveAttachment(id, taskId),
    onSuccess: invalidate,
  })
  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => rejectAttachment(id, note),
    onSuccess: invalidate,
  })

  const list = pendingQuery.data ?? []

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">{pt.approvalsFiles.title}</h1>

      <div className="mt-6 space-y-3">
        {pendingQuery.isLoading && <Spinner />}
        {!pendingQuery.isLoading && list.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {pt.approvalsFiles.empty}
          </p>
        )}
        {list.map((att) => (
          <ReviewRow
            key={att.id}
            att={att}
            uploader={att.uploaded_by ? membersById.get(att.uploaded_by) : undefined}
            onApprove={() => approveMut.mutate({ id: att.id, taskId: att.task_id })}
            onReject={() => {
              const note = window.prompt(pt.deliverables.rejectPrompt) ?? ''
              rejectMut.mutate({ id: att.id, note })
            }}
            busy={approveMut.isPending || rejectMut.isPending}
          />
        ))}
      </div>
    </div>
  )
}

function ReviewRow({
  att,
  uploader,
  onApprove,
  onReject,
  busy,
}: {
  att: PendingAttachment
  uploader?: Member
  onApprove: () => void
  onReject: () => void
  busy: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex gap-3">
        <AttachmentThumb att={att} size={72} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-slate-800">{att.file_name}</div>
          <div className="mt-0.5 text-sm text-slate-500">
            {pt.approvalsFiles.task}:{' '}
            <span className="font-medium text-slate-600">{att.task?.title ?? '—'}</span>
          </div>
          <div className="text-xs text-slate-400">
            {pt.approvalsFiles.from} {uploader?.name ?? '—'} · {formatDateTime(att.created_at)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" onClick={onReject} disabled={busy}>
          <Icon name="close" size={16} />
          {pt.deliverables.reject}
        </Button>
        <Button onClick={onApprove} disabled={busy}>
          <Icon name="check" size={16} />
          {pt.deliverables.approve}
        </Button>
      </div>
    </div>
  )
}
