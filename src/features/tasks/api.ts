import { supabase } from '@/lib/supabase'
import type { Task, TaskComment, TaskStatus } from '@/types/database'

export async function fetchTasks(): Promise<Task[]> {
  // As políticas RLS tratam da visibilidade: o líder vê todas, o membro só as suas.
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Task[]
}

export interface NewTask {
  title: string
  description: string | null
  area_id: string | null
  assignee_id: string | null
  due_date: string | null
  created_by: string | null
}

export async function createTask(input: NewTask): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      area_id: input.area_id,
      assignee_id: input.assignee_id,
      due_date: input.due_date,
      created_by: input.created_by,
      status: 'todo',
      position: Date.now(),
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Task
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
  if (error) throw error
}

export interface TaskPatch {
  title?: string
  description?: string | null
  area_id?: string | null
  assignee_id?: string | null
  due_date?: string | null
  status?: TaskStatus
}

export async function updateTask(id: string, patch: TaskPatch): Promise<void> {
  const { error } = await supabase.from('tasks').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function fetchComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as TaskComment[]
}

export async function addComment(
  taskId: string,
  authorId: string,
  body: string,
): Promise<void> {
  const { error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, author_id: authorId, body: body.trim() })
  if (error) throw error
}

// "Pedir mais prazo" gera uma entrada na fila de aprovação do líder (fase 2),
// ligada à tarefa. Reutiliza a tabela submissions.
export async function requestExtension(
  task: Task,
  submittedBy: string,
  note: string,
): Promise<void> {
  const { error } = await supabase.from('submissions').insert({
    title: `Pedido de mais prazo: ${task.title}`,
    description: note.trim() || null,
    type: 'pedido',
    submitted_by: submittedBy,
    related_task_id: task.id,
  })
  if (error) throw error
}
