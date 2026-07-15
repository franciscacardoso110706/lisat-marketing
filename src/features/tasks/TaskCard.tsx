import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Area, Task } from '@/types/database'
import { Avatar } from '@/components/ui/Avatar'
import { dueInfo } from '@/lib/dates'
import { pt } from '@/i18n/pt'

export interface ResolvedTask {
  task: Task
  area?: Area
  assigneeName?: string
}

const dueTone: Record<string, string> = {
  overdue: 'bg-rose-50 text-rose-600',
  soon: 'bg-amber-50 text-amber-600',
  normal: 'bg-slate-100 text-slate-500',
}

/** Conteúdo visual do cartão (usado no board e no overlay de arrasto). */
export function TaskCardContent({
  data,
  showAssignee = true,
  dragging = false,
}: {
  data: ResolvedTask
  showAssignee?: boolean
  dragging?: boolean
}) {
  const { task, area, assigneeName } = data
  const due = dueInfo(task.due_date)
  return (
    <div
      className={`rounded-xl border bg-white p-3 shadow-card transition ${
        dragging
          ? 'rotate-2 border-brand-300 shadow-pop'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-2">
        {area && (
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: area.color }}
            title={area.name}
          />
        )}
        <p className="flex-1 text-sm font-medium leading-snug text-slate-800">
          {task.title}
        </p>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {area && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${area.color}26`, color: area.color }}
            >
              {area.name}
            </span>
          )}
          {due && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${dueTone[due.tone]}`}
            >
              {due.label}
            </span>
          )}
        </div>
        {showAssignee &&
          (assigneeName ? (
            <Avatar name={assigneeName} size="sm" />
          ) : (
            <span className="text-[11px] text-slate-400">{pt.tasks.unassigned}</span>
          ))}
      </div>
    </div>
  )
}

/** Cartão arrastável usado dentro das colunas. */
export function TaskCard({
  data,
  showAssignee,
  onClick,
}: {
  data: ResolvedTask
  showAssignee?: boolean
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: data.task.id,
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
      <TaskCardContent data={data} showAssignee={showAssignee} />
    </button>
  )
}
