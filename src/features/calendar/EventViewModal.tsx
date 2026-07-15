import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { eventMeta } from './eventMeta'
import { longDate } from '@/lib/calendarGrid'
import { pt } from '@/i18n/pt'
import type { CalendarEvent } from '@/types/database'

/** Vista só-leitura de um evento (para membros). */
export function EventViewModal({
  event,
  open,
  onClose,
}: {
  event: CalendarEvent | null
  open: boolean
  onClose: () => void
}) {
  if (!event) return null
  const meta = eventMeta[event.type]
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event.title}
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
          <span className="text-sm text-slate-500">
            {longDate(event.start_date)}
            {event.end_date && event.end_date !== event.start_date
              ? ` – ${longDate(event.end_date)}`
              : ''}
          </span>
        </div>
        {event.description && (
          <p className="whitespace-pre-wrap text-sm text-slate-600">{event.description}</p>
        )}
      </div>
    </Modal>
  )
}
