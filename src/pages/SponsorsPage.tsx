import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { fetchSponsors, updateSponsorStage } from '@/features/sponsors/api'
import { fetchMembers } from '@/features/members/api'
import { SponsorBoard } from '@/features/sponsors/SponsorBoard'
import { SponsorFormModal } from '@/features/sponsors/SponsorFormModal'
import { SponsorViewModal } from '@/features/sponsors/SponsorViewModal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Icon } from '@/components/ui/Icon'
import { pt } from '@/i18n/pt'
import type { Sponsor, SponsorStage } from '@/types/database'

export function SponsorsPage() {
  const { member } = useAuth()
  const isLeader = member?.role === 'leader'
  const qc = useQueryClient()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Sponsor | null>(null)
  const [viewing, setViewing] = useState<Sponsor | null>(null)

  const sponsorsQuery = useQuery({ queryKey: ['sponsors'], queryFn: fetchSponsors })
  const membersQuery = useQuery({ queryKey: ['members'], queryFn: fetchMembers })

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: SponsorStage }) =>
      updateSponsorStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsors'] }),
  })

  const sponsors = sponsorsQuery.data ?? []
  const members = membersQuery.data ?? []
  const loading = sponsorsQuery.isLoading || membersQuery.isLoading

  const onCardClick = (s: Sponsor) => {
    if (isLeader) {
      setEditing(s)
      setFormOpen(true)
    } else {
      setViewing(s)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{pt.sponsors.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLeader ? pt.sponsors.subtitleLeader : pt.sponsors.subtitleMember}
          </p>
        </div>
        {isLeader && (
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Icon name="plus" size={16} />
            {pt.sponsors.newSponsor}
          </Button>
        )}
      </div>

      <div className="mt-5">
        {loading ? (
          <Spinner />
        ) : sponsors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {isLeader ? pt.sponsors.empty : pt.sponsors.emptyMember}
          </div>
        ) : (
          <SponsorBoard
            sponsors={sponsors}
            members={members}
            readOnly={!isLeader}
            onCardClick={onCardClick}
            onStageChange={(id, stage) => stageMutation.mutate({ id, stage })}
          />
        )}
      </div>

      {isLeader && (
        <SponsorFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          sponsor={editing}
          members={members}
        />
      )}
      <SponsorViewModal
        sponsor={viewing}
        members={members}
        open={!!viewing}
        onClose={() => setViewing(null)}
      />
    </div>
  )
}
