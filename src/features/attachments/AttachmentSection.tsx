import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ACCEPTED,
  MAX_SIZE,
  approveAttachment,
  deleteAttachment,
  listAttachments,
  rejectAttachment,
  uploadAttachment,
} from './api'
import { AttachmentThumb } from './AttachmentThumb'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateTime } from '@/lib/dates'
import { pt } from '@/i18n/pt'
import type { AttachmentStatus, Member, Task, TaskAttachment } from '@/types/database'

const statusCls: Record<AttachmentStatus, string> = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-rose-50 text-rose-600',
}
const statusLabel: Record<AttachmentStatus, string> = {
  pending: pt.deliverables.statusPending,
  approved: pt.deliverables.statusApproved,
  rejected: pt.deliverables.statusRejected,
}

export function AttachmentSection({
  task,
  members,
  currentMemberId,
  isLeader,
}: {
  task: Task
  members: Member[]
  currentMemberId: string | null
  isLeader: boolean
}) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const canUpload = isLeader || currentMemberId === task.assignee_id
  const membersById = new Map(members.map((m) => [m.id, m]))

  const attsQuery = useQuery({
    queryKey: ['attachments', task.id],
    queryFn: () => listAttachments(task.id),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['attachments'] })
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  const uploadMut = useMutation({
    mutationFn: (file: File) =>
      uploadAttachment(task, file, currentMemberId!, isLeader),
    onSuccess: invalidate,
    onError: () => setError(pt.common.error),
  })

  const approveMut = useMutation({
    mutationFn: (id: string) => approveAttachment(id, task.id),
    onSuccess: invalidate,
  })
  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => rejectAttachment(id, note),
    onSuccess: invalidate,
  })
  const deleteMut = useMutation({
    mutationFn: (att: TaskAttachment) => deleteAttachment(att),
    onSuccess: invalidate,
  })

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    const file = e.target.files?.[0]
    e.target.value = '' // permite re-selecionar o mesmo ficheiro
    if (!file) return
    if (file.size > MAX_SIZE) return setError(pt.deliverables.tooBig)
    if (ACCEPTED && file.type && !ACCEPTED.split(',').includes(file.type)) {
      return setError(pt.deliverables.badType)
    }
    uploadMut.mutate(file)
  }

  const atts = attsQuery.data ?? []

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {pt.deliverables.section}
        </h3>
        {canUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              onChange={onPick}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadMut.isPending}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              <Icon name="paperclip" size={16} />
              {uploadMut.isPending ? pt.deliverables.uploading : pt.deliverables.add}
            </button>
          </>
        )}
      </div>

      {canUpload && (
        <p className="mb-2 text-xs text-slate-400">
          {isLeader ? pt.deliverables.hintLeader : pt.deliverables.hintMember}
        </p>
      )}
      {error && <p className="mb-2 text-xs text-rose-600">{error}</p>}

      {attsQuery.isLoading ? (
        <Spinner />
      ) : atts.length === 0 ? (
        <p className="text-sm text-slate-400">{pt.deliverables.empty}</p>
      ) : (
        <div className="space-y-2">
          {atts.map((att) => {
            const uploader = att.uploaded_by ? membersById.get(att.uploaded_by) : undefined
            const canDelete = isLeader || att.uploaded_by === currentMemberId
            return (
              <div
                key={att.id}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white p-2.5"
              >
                <AttachmentThumb att={att} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-800">
                      {att.file_name}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusCls[att.status]}`}
                    >
                      {statusLabel[att.status]}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {uploader?.name ?? '—'} · {formatDateTime(att.created_at)}
                  </div>
                  {att.status === 'rejected' && att.leader_note && (
                    <p className="mt-1 rounded-lg bg-rose-50 px-2 py-1 text-xs text-rose-700">
                      {att.leader_note}
                    </p>
                  )}

                  {/* Ações */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {isLeader && att.status !== 'approved' && (
                      <button
                        onClick={() => approveMut.mutate(att.id)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        {pt.deliverables.approve}
                      </button>
                    )}
                    {isLeader && att.status !== 'rejected' && (
                      <button
                        onClick={() => {
                          const note = window.prompt(pt.deliverables.rejectPrompt) ?? ''
                          rejectMut.mutate({ id: att.id, note })
                        }}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700"
                      >
                        {pt.deliverables.reject}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          if (confirm(pt.deliverables.removeConfirm)) deleteMut.mutate(att)
                        }}
                        className="text-xs font-medium text-slate-400 hover:text-rose-600"
                      >
                        {pt.deliverables.remove}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
