import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { Area, Member, Task, TaskStatus } from '@/types/database'
import { TaskCard, TaskCardContent, type ResolvedTask } from './TaskCard'
import { pt } from '@/i18n/pt'

const COLUMNS: { status: TaskStatus; label: string; accent: string }[] = [
  { status: 'todo', label: pt.tasks.status.todo, accent: 'bg-slate-400' },
  { status: 'doing', label: pt.tasks.status.doing, accent: 'bg-brand-500' },
  { status: 'done', label: pt.tasks.status.done, accent: 'bg-emerald-500' },
]

export function TaskBoard({
  tasks,
  areas,
  members,
  showAssignee = true,
  onCardClick,
  onStatusChange,
}: {
  tasks: Task[]
  areas: Area[]
  members: Member[]
  showAssignee?: boolean
  onCardClick: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    // Distância mínima antes de iniciar o arrasto → o clique/tap continua a funcionar.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // No telemóvel: pressão longa inicia o arrasto (deixa o scroll normal funcionar).
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  const areasById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas])
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const resolve = (task: Task): ResolvedTask => ({
    task,
    area: task.area_id ? areasById.get(task.area_id) : undefined,
    assigneeName: task.assignee_id ? membersById.get(task.assignee_id)?.name : undefined,
  })

  const byStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status).map(resolve)

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const taskId = String(e.active.id)
    const overStatus = e.over?.id as TaskStatus | undefined
    if (!overStatus) return
    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== overStatus) onStatusChange(taskId, overStatus)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <Column
            key={col.status}
            status={col.status}
            label={col.label}
            accent={col.accent}
            items={byStatus(col.status)}
            showAssignee={showAssignee}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TaskCardContent data={resolve(activeTask)} showAssignee={showAssignee} dragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function Column({
  status,
  label,
  accent,
  items,
  showAssignee,
  onCardClick,
}: {
  status: TaskStatus
  label: string
  accent: string
  items: ResolvedTask[]
  showAssignee: boolean
  onCardClick: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[8rem] flex-col rounded-2xl border p-3 transition ${
        isOver ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-100/70'
      }`}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-card">
          {items.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-slate-400">{pt.tasks.empty}</p>
        ) : (
          items.map((item) => (
            <TaskCard
              key={item.task.id}
              data={item}
              showAssignee={showAssignee}
              onClick={() => onCardClick(item.task)}
            />
          ))
        )}
      </div>
    </div>
  )
}
