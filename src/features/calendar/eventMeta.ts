import { pt } from '@/i18n/pt'
import type { EventType } from '@/types/database'

export interface EventMeta {
  label: string
  color: string
}

export const eventMeta: Record<EventType, EventMeta> = {
  conteudo: { label: pt.eventTypes.conteudo, color: '#e11d48' }, // rosa/conteúdo
  reuniao: { label: pt.eventTypes.reuniao, color: '#2563eb' }, // azul/reunião
  evento: { label: pt.eventTypes.evento, color: '#059669' }, // verde/evento
  academico: { label: pt.eventTypes.academico, color: '#d97706' }, // âmbar/académico
}

export const EVENT_TYPE_ORDER: EventType[] = [
  'conteudo',
  'reuniao',
  'evento',
  'academico',
]
