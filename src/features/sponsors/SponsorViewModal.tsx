import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { stageMetaOf } from './stageMeta'
import { dueInfo } from '@/lib/dates'
import { pt } from '@/i18n/pt'
import type { Member, Sponsor } from '@/types/database'

/** Vista só-leitura de um sponsor (para membros da área Sponsors). */
export function SponsorViewModal({
  sponsor,
  members,
  open,
  onClose,
}: {
  sponsor: Sponsor | null
  members: Member[]
  open: boolean
  onClose: () => void
}) {
  if (!sponsor) return null
  const meta = stageMetaOf(sponsor.stage)
  const owner = sponsor.owner_id
    ? members.find((m) => m.id === sponsor.owner_id)
    : undefined
  const follow = dueInfo(sponsor.next_followup_date)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sponsor.name}
      footer={<Button onClick={onClose}>{pt.common.close}</Button>}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
          >
            {meta.label}
          </span>
          {follow && (
            <span className="text-sm text-slate-500">
              {pt.sponsors.followup}: {follow.label}
            </span>
          )}
        </div>
        {sponsor.contact && (
          <div className="text-sm text-slate-600">
            <span className="text-slate-400">{pt.sponsors.fieldContact}: </span>
            {sponsor.contact}
          </div>
        )}
        {owner && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Avatar name={owner.name} size="sm" />
            {owner.name}
          </div>
        )}
        {sponsor.notes && (
          <p className="whitespace-pre-wrap text-sm text-slate-600">{sponsor.notes}</p>
        )}
      </div>
    </Modal>
  )
}
