import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { fetchSubmissions } from '@/features/submissions/api'
import { fetchAreas, fetchMembers } from '@/features/members/api'
import { fetchTasks } from '@/features/tasks/api'
import { ReviewModal } from '@/features/submissions/ReviewModal'
import { StatusBadge, TypeBadge } from '@/features/submissions/badges'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateTime } from '@/lib/dates'
import { pt } from '@/i18n/pt'
import type { Member, Submission } from '@/types/database'

export function ApprovalsPage() {
  const { member } = useAuth()
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [review, setReview] = useState<Submission | null>(null)

  const subsQuery = useQuery({ queryKey: ['submissions'], queryFn: () => fetchSubmissions() })
  const membersQuery = useQuery({ queryKey: ['members'], queryFn: fetchMembers })
  const areasQuery = useQuery({ queryKey: ['areas'], queryFn: fetchAreas })
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })

  const members = membersQuery.data ?? []
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const pending = (subsQuery.data ?? []).filter((s) => s.status === 'pending')
  const history = (subsQuery.data ?? []).filter((s) => s.status !== 'pending')
  const list = tab === 'pending' ? pending : history

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">{pt.approvals.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{pt.approvals.subtitle}</p>

      {/* Separadores */}
      <div className="mt-5 inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
        <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
          {pt.approvals.pending}
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
              {pending.length}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
          {pt.approvals.history}
        </TabButton>
      </div>

      <div className="mt-5 space-y-2">
        {subsQuery.isLoading && <Spinner />}
        {!subsQuery.isLoading && list.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {tab === 'pending' ? pt.approvals.emptyPending : pt.approvals.emptyHistory}
          </p>
        )}
        {list.map((s) => (
          <SubmissionRow
            key={s.id}
            submission={s}
            submitter={s.submitted_by ? membersById.get(s.submitted_by) : undefined}
            onReview={() => setReview(s)}
          />
        ))}
      </div>

      <ReviewModal
        submission={review}
        open={!!review}
        onClose={() => setReview(null)}
        members={members}
        areas={areasQuery.data ?? []}
        tasks={tasksQuery.data ?? []}
        currentMemberId={member?.id ?? null}
      />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

function SubmissionRow({
  submission,
  submitter,
  onReview,
}: {
  submission: Submission
  submitter?: Member
  onReview: () => void
}) {
  const isPending = submission.status === 'pending'
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-slate-800">{submission.title}</span>
        <TypeBadge type={submission.type} />
        {!isPending && <StatusBadge status={submission.status} />}
        <span className="ml-auto text-xs text-slate-400">
          {formatDateTime(submission.created_at)}
        </span>
      </div>
      <div className="mt-1 text-sm text-slate-500">
        {pt.approvals.from} <span className="font-medium text-slate-600">{submitter?.name ?? '—'}</span>
      </div>
      {submission.description && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
          {submission.description}
        </p>
      )}
      {submission.status === 'rejected' && submission.leader_note && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {submission.leader_note}
        </p>
      )}
      {isPending && (
        <div className="mt-3 flex justify-end">
          <Button onClick={onReview}>{pt.approvals.accept} / {pt.approvals.reject}</Button>
        </div>
      )}
    </div>
  )
}
