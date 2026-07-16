import { supabase } from '@/lib/supabase'
import type { Task, TaskAttachment } from '@/types/database'

const BUCKET = 'task-files'

export const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
export const ACCEPTED =
  'image/png,image/jpeg,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'

export function isImage(mime: string | null): boolean {
  return !!mime && mime.startsWith('image/')
}

export async function listAttachments(taskId: string): Promise<TaskAttachment[]> {
  const { data, error } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as TaskAttachment[]
}

export interface PendingAttachment extends TaskAttachment {
  task: { id: string; title: string } | null
}

export async function fetchPendingAttachments(): Promise<PendingAttachment[]> {
  const { data, error } = await supabase
    .from('task_attachments')
    .select('*, task:tasks(id, title)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as PendingAttachment[]
}

/** Todos os anexos que o utilizador pode ver (RLS trata da visibilidade).
 *  Útil para mostrar o estado de entrega por tarefa na página "Entregas". */
export async function fetchVisibleAttachments(): Promise<TaskAttachment[]> {
  const { data, error } = await supabase
    .from('task_attachments')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as TaskAttachment[]
}

export async function countPendingAttachments(): Promise<number> {
  const { count, error } = await supabase
    .from('task_attachments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (error) throw error
  return count ?? 0
}

export async function uploadAttachment(
  task: Task,
  file: File,
  memberId: string,
  isLeader: boolean,
): Promise<void> {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const path = `${task.id}/${crypto.randomUUID()}.${ext}`

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false })
  if (upErr) throw upErr

  const { error: rowErr } = await supabase.from('task_attachments').insert({
    task_id: task.id,
    uploaded_by: memberId,
    file_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
    // Ficheiros do líder entram já aprovados (referência/brief);
    // os do membro entram pendentes de revisão.
    status: isLeader ? 'approved' : 'pending',
  })
  if (rowErr) {
    // Se a linha falhar, tenta limpar o ficheiro para não deixar lixo.
    await supabase.storage.from(BUCKET).remove([path])
    throw rowErr
  }
}

/** URL temporário para ver/descarregar um ficheiro do bucket privado. */
export async function signedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60)
  if (error) return null
  return data?.signedUrl ?? null
}

export async function approveAttachment(id: string, taskId: string): Promise<void> {
  const { error } = await supabase
    .from('task_attachments')
    .update({ status: 'approved', leader_note: null, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error

  // Aprovar o entregável marca a tarefa como concluída.
  const { error: taskErr } = await supabase
    .from('tasks')
    .update({ status: 'done' })
    .eq('id', taskId)
  if (taskErr) throw taskErr
}

export async function rejectAttachment(id: string, note: string): Promise<void> {
  const { error } = await supabase
    .from('task_attachments')
    .update({
      status: 'rejected',
      leader_note: note.trim() || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteAttachment(att: TaskAttachment): Promise<void> {
  await supabase.storage.from(BUCKET).remove([att.file_path])
  const { error } = await supabase.from('task_attachments').delete().eq('id', att.id)
  if (error) throw error
}
