import { supabase } from '@/lib/supabase'
import { createTask } from '@/features/tasks/api'
import type { Submission, SubmissionStatus, SubmissionType } from '@/types/database'

export async function fetchSubmissions(
  status?: SubmissionStatus,
): Promise<Submission[]> {
  // RLS: o líder vê todas; o membro vê só as suas.
  let query = supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data as Submission[]
}

export interface NewSubmission {
  title: string
  description: string | null
  type: SubmissionType
  submitted_by: string | null
}

export async function createSubmission(input: NewSubmission): Promise<void> {
  const { error } = await supabase.from('submissions').insert({
    title: input.title.trim(),
    description: input.description?.trim() || null,
    type: input.type,
    submitted_by: input.submitted_by,
  })
  if (error) throw error
}

export interface AcceptAsTaskInput {
  title: string
  description: string | null
  area_id: string | null
  assignee_id: string | null
  due_date: string | null
  created_by: string | null
}

/** Aceita uma submissão criando uma tarefa e ligando-a à submissão. */
export async function acceptAsTask(
  submission: Submission,
  taskInput: AcceptAsTaskInput,
): Promise<void> {
  const task = await createTask(taskInput)
  const { error } = await supabase
    .from('submissions')
    .update({ status: 'accepted', created_task_id: task.id })
    .eq('id', submission.id)
  if (error) throw error
}

/** Aceita um pedido de mais prazo: atualiza (opcionalmente) o prazo da tarefa ligada. */
export async function acceptExtension(
  submission: Submission,
  newDueDate: string | null,
): Promise<void> {
  if (newDueDate && submission.related_task_id) {
    const { error: taskErr } = await supabase
      .from('tasks')
      .update({ due_date: newDueDate })
      .eq('id', submission.related_task_id)
    if (taskErr) throw taskErr
  }
  const { error } = await supabase
    .from('submissions')
    .update({ status: 'accepted' })
    .eq('id', submission.id)
  if (error) throw error
}

export async function rejectSubmission(id: string, note: string): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({ status: 'rejected', leader_note: note.trim() || null })
    .eq('id', id)
  if (error) throw error
}

export async function countPendingSubmissions(): Promise<number> {
  const { count, error } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (error) throw error
  return count ?? 0
}
