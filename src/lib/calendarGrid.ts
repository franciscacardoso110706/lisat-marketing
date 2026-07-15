import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { pt as ptLocale } from 'date-fns/locale'

const WEEK_OPTS = { weekStartsOn: 1 as const } // segunda-feira

/** Devolve as semanas (arrays de 7 datas) que compõem a grelha do mês. */
export function monthMatrix(cursor: Date): Date[][] {
  const start = startOfWeek(startOfMonth(cursor), WEEK_OPTS)
  const end = endOfWeek(endOfMonth(cursor), WEEK_OPTS)
  const days = eachDayOfInterval({ start, end })
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

export function monthLabel(cursor: Date): string {
  const label = format(cursor, 'LLLL yyyy', { locale: ptLocale })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** 'YYYY-MM-DD' de uma Date (sem influência de fuso). */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function fromISODate(iso: string): Date {
  return parseISO(iso)
}

export function longDate(iso: string): string {
  return format(parseISO(iso), "d 'de' LLLL", { locale: ptLocale })
}

/** true se `day` está dentro de [startIso, endIso] (inclusive). endIso pode ser null. */
export function dayInRange(day: Date, startIso: string, endIso: string | null): boolean {
  const start = parseISO(startIso)
  const end = endIso ? parseISO(endIso) : start
  const d = toISODate(day)
  return d >= toISODate(start) && d <= toISODate(end)
}

export { addMonths, isSameDay, isSameMonth, isToday }
