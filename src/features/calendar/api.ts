import { supabase } from '@/lib/supabase'
import type { CalendarEvent, EventType } from '@/types/database'

export async function fetchEvents(): Promise<CalendarEvent[]> {
  // RLS: todos os membros do espaço leem os eventos.
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('start_date', { ascending: true })
  if (error) throw error
  return data as CalendarEvent[]
}

export interface EventInput {
  title: string
  description: string | null
  type: EventType
  start_date: string
  end_date: string | null
  created_by: string | null
}

export async function createEvent(input: EventInput): Promise<void> {
  const { error } = await supabase.from('calendar_events').insert({
    title: input.title.trim(),
    description: input.description?.trim() || null,
    type: input.type,
    start_date: input.start_date,
    end_date: input.end_date,
    all_day: true,
    created_by: input.created_by,
  })
  if (error) throw error
}

export async function updateEvent(
  id: string,
  patch: Omit<EventInput, 'created_by'>,
): Promise<void> {
  const { error } = await supabase
    .from('calendar_events')
    .update({
      title: patch.title.trim(),
      description: patch.description?.trim() || null,
      type: patch.type,
      start_date: patch.start_date,
      end_date: patch.end_date,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) throw error
}
