// Tipos das tabelas da base de dados (espelham supabase/schema.sql).
// Mantidos à mão por simplicidade; se o esquema crescer muito, podem ser gerados
// automaticamente com `supabase gen types typescript`.

export type Role = 'leader' | 'member'

export type TaskStatus = 'todo' | 'doing' | 'done'

export type SubmissionType = 'ideia' | 'pedido' | 'impedimento' | 'outro'
export type SubmissionStatus = 'pending' | 'accepted' | 'rejected'

export type EventType = 'conteudo' | 'reuniao' | 'evento' | 'academico'

export type SponsorStage =
  | 'lead'
  | 'contactado'
  | 'reuniao'
  | 'proposta'
  | 'fechado'
  | 'perdido'

export interface Space {
  id: string
  name: string
  created_at: string
}

export interface Member {
  id: string
  space_id: string
  email: string
  auth_user_id: string | null
  name: string
  area: string | null
  role: Role
  contact: string | null
  active: boolean
  created_at: string
}

export interface Area {
  id: string
  space_id: string
  name: string
  color: string
}

export interface Task {
  id: string
  space_id: string
  title: string
  description: string | null
  area_id: string | null
  assignee_id: string | null
  status: TaskStatus
  due_date: string | null
  position: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string | null
  body: string
  created_at: string
}

export interface Submission {
  id: string
  space_id: string
  title: string
  description: string | null
  type: SubmissionType
  submitted_by: string | null
  status: SubmissionStatus
  leader_note: string | null
  related_task_id: string | null
  created_task_id: string | null
  created_at: string
}

export interface CalendarEvent {
  id: string
  space_id: string
  title: string
  description: string | null
  type: EventType
  start_date: string
  end_date: string | null
  all_day: boolean
  related_sponsor_id: string | null
  created_by: string | null
  created_at: string
}

export interface Sponsor {
  id: string
  space_id: string
  name: string
  contact: string | null
  owner_id: string | null
  stage: SponsorStage
  next_followup_date: string | null
  notes: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface LinkItem {
  id: string
  space_id: string
  title: string
  url: string
  description: string | null
  position: number
  created_by: string | null
  created_at: string
}
