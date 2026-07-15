import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { fetchEvents } from '@/features/calendar/api'
import { EventFormModal } from '@/features/calendar/EventFormModal'
import { EventViewModal } from '@/features/calendar/EventViewModal'
import { eventMeta } from '@/features/calendar/eventMeta'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Icon } from '@/components/ui/Icon'
import {
  addMonths,
  dayInRange,
  fromISODate,
  isSameDay,
  isSameMonth,
  isToday,
  longDate,
  monthLabel,
  monthMatrix,
  toISODate,
} from '@/lib/calendarGrid'
import { pt } from '@/i18n/pt'
import type { CalendarEvent } from '@/types/database'

export function CalendarPage() {
  const { member } = useAuth()
  const isLeader = member?.role === 'leader'

  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [viewing, setViewing] = useState<CalendarEvent | null>(null)

  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: fetchEvents })
  const events = eventsQuery.data ?? []

  const weeks = useMemo(() => monthMatrix(cursor), [cursor])

  const chipsForDay = (day: Date) =>
    events
      .filter((e) =>
        e.type === 'academico'
          ? isSameDay(day, fromISODate(e.start_date))
          : dayInRange(day, e.start_date, e.end_date),
      )
      .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const isAcademic = (day: Date) =>
    events.some((e) => e.type === 'academico' && dayInRange(day, e.start_date, e.end_date))

  const eventsForPanel = (day: Date) =>
    events
      .filter((e) => dayInRange(day, e.start_date, e.end_date))
      .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const openEvent = (e: CalendarEvent) => {
    if (isLeader) {
      setEditing(e)
      setFormOpen(true)
    } else {
      setViewing(e)
    }
  }

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const panelEvents = eventsForPanel(selected)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{pt.calendar.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLeader ? pt.calendar.subtitleLeader : pt.calendar.subtitleMember}
          </p>
        </div>
        {isLeader && (
          <Button onClick={openNew}>
            <Icon name="plus" size={16} />
            {pt.calendar.newEvent}
          </Button>
        )}
      </div>

      {/* Barra de navegação do mês */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => addMonths(c, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            aria-label="Mês anterior"
          >
            <span className="rotate-90 inline-block">
              <Icon name="chevron-down" size={18} />
            </span>
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            aria-label="Mês seguinte"
          >
            <span className="-rotate-90 inline-block">
              <Icon name="chevron-down" size={18} />
            </span>
          </button>
          <h2 className="ml-2 text-lg font-semibold text-slate-800">
            {monthLabel(cursor)}
          </h2>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            const now = new Date()
            setCursor(now)
            setSelected(now)
          }}
        >
          {pt.calendar.today}
        </Button>
      </div>

      {/* Grelha */}
      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {pt.calendar.weekdays.map((w) => (
            <div
              key={w}
              className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              {w}
            </div>
          ))}
        </div>

        {eventsQuery.isLoading ? (
          <Spinner />
        ) : (
          weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day) => {
                const inMonth = isSameMonth(day, cursor)
                const academic = isAcademic(day)
                const selectedCell = isSameDay(day, selected)
                const chips = chipsForDay(day)
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelected(day)}
                    title={academic ? pt.calendar.lowLoad : undefined}
                    className={`min-h-[4.75rem] cursor-pointer border-b border-r border-slate-100 p-1.5 transition sm:min-h-[6.5rem] ${
                      academic ? 'bg-amber-50/70' : inMonth ? 'bg-white' : 'bg-slate-50/60'
                    } ${selectedCell ? 'ring-2 ring-inset ring-brand-500' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          isToday(day)
                            ? 'bg-brand-600 text-white'
                            : inMonth
                              ? 'text-slate-600'
                              : 'text-slate-300'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                    <div className="mt-1 space-y-1">
                      {chips.slice(0, 3).map((e) => {
                        const meta = eventMeta[e.type]
                        return (
                          <button
                            key={e.id}
                            onClick={(ev) => {
                              ev.stopPropagation()
                              openEvent(e)
                            }}
                            className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight"
                            style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                          >
                            {e.title}
                          </button>
                        )
                      })}
                      {chips.length > 3 && (
                        <div className="px-1 text-[10px] text-slate-400">
                          +{chips.length - 3} {pt.calendar.more}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* Painel do dia selecionado */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            {pt.calendar.eventsOf} {longDate(toISODate(selected))}
          </h3>
          {isLeader && (
            <button
              onClick={openNew}
              className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <Icon name="plus" size={16} />
              {pt.calendar.newEvent}
            </button>
          )}
        </div>
        <div className="space-y-2">
          {panelEvents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              {pt.calendar.noEventsDay}
            </p>
          ) : (
            panelEvents.map((e) => {
              const meta = eventMeta[e.type]
              return (
                <button
                  key={e.id}
                  onClick={() => openEvent(e)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-card transition hover:border-slate-300"
                >
                  <span
                    className="h-8 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-800">{e.title}</div>
                    <div className="text-xs text-slate-500">
                      {meta.label}
                      {e.end_date && e.end_date !== e.start_date
                        ? ` · ${longDate(e.start_date)} – ${longDate(e.end_date)}`
                        : ''}
                    </div>
                  </div>
                  {isLeader && <Icon name="edit" size={16} className="text-slate-400" />}
                </button>
              )
            })
          )}
        </div>
      </div>

      <EventFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        event={editing}
        defaultDate={toISODate(selected)}
        createdBy={member?.id ?? null}
      />
      <EventViewModal
        event={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
      />
    </div>
  )
}
