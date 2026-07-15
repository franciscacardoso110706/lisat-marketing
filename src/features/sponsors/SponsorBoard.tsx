import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Avatar } from '@/components/ui/Avatar'
import { dueInfo } from '@/lib/dates'
import { SPONSOR_STAGES } from './stageMeta'
import { pt } from '@/i18n/pt'
import type { Member, Sponsor, SponsorStage } from '@/types/database'

interface ResolvedSponsor {
  sponsor: Sponsor
  ownerName?: string
}

const followTone: Record<string, string> = {
  overdue: 'bg-rose-50 text-rose-600',
  soon: 'bg-amber-50 text-amber-600',
  normal: 'bg-slate-100 text-slate-500',
}

function SponsorCardContent({
  data,
  dragging = false,
}: {
  data: ResolvedSponsor
  dragging?: boolean
}) {
  const { sponsor, ownerName } = data
  const follow = dueInfo(sponsor.next_followup_date)
  return (
    <div
      className={`rounded-xl border bg-white p-3 shadow-card transition ${
        dragging ? 'rotate-2 border-brand-300 shadow-pop' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="font-medium leading-snug text-slate-800">{sponsor.name}</div>
      {sponsor.contact && (
        <div className="mt-0.5 truncate text-xs text-slate-500">{sponsor.contact}</div>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        {follow ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${followTone[follow.tone]}`}
          >
            {pt.sponsors.followup}: {follow.label}
          </span>
        ) : (
          <span />
        )}
        {ownerName && <Avatar name={ownerName} size="sm" />}
      </div>
    </div>
  )
}

function DraggableCard({
  data,
  onClick,
}: {
  data: ResolvedSponsor
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: data.sponsor.id,
  })
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`w-full cursor-grab touch-none text-left active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      <SponsorCardContent data={data} />
    </button>
  )
}

export function SponsorBoard({
  sponsors,
  members,
  readOnly = false,
  onCardClick,
  onStageChange,
}: {
  sponsors: Sponsor[]
  members: Member[]
  readOnly?: boolean
  onCardClick: (s: Sponsor) => void
  onStageChange: (id: string, stage: SponsorStage) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  const resolve = (s: Sponsor): ResolvedSponsor => ({
    sponsor: s,
    ownerName: s.owner_id ? membersById.get(s.owner_id)?.name : undefined,
  })

  const byStage = (stage: SponsorStage) =>
    sponsors.filter((s) => s.stage === stage).map(resolve)

  const activeSponsor = activeId ? sponsors.find((s) => s.id === activeId) : null

  const columns = (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {SPONSOR_STAGES.map((col) => (
        <Column
          key={col.stage}
          stage={col.stage}
          label={col.label}
          color={col.color}
          items={byStage(col.stage)}
          readOnly={readOnly}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  )

  if (readOnly) return columns

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }
  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const id = String(e.active.id)
    const overStage = e.over?.id as SponsorStage | undefined
    if (!overStage) return
    const s = sponsors.find((x) => x.id === id)
    if (s && s.stage !== overStage) onStageChange(id, overStage)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {columns}
      <DragOverlay dropAnimation={null}>
        {activeSponsor ? <SponsorCardContent data={resolve(activeSponsor)} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function Column({
  stage,
  label,
  color,
  items,
  readOnly,
  onCardClick,
}: {
  stage: SponsorStage
  label: string
  color: string
  items: ResolvedSponsor[]
  readOnly: boolean
  onCardClick: (s: Sponsor) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, disabled: readOnly })
  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl border p-3 transition ${
        isOver ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-100/70'
      }`}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-card">
          {items.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-slate-400">
            {pt.sponsors.emptyColumn}
          </p>
        ) : readOnly ? (
          items.map((item) => (
            <button
              key={item.sponsor.id}
              onClick={() => onCardClick(item.sponsor)}
              className="w-full text-left"
            >
              <SponsorCardContent data={item} />
            </button>
          ))
        ) : (
          items.map((item) => (
            <DraggableCard
              key={item.sponsor.id}
              data={item}
              onClick={() => onCardClick(item.sponsor)}
            />
          ))
        )}
      </div>
    </div>
  )
}
