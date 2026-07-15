import { supabase } from '@/lib/supabase'
import type { LinkItem } from '@/types/database'

/** Garante que o URL tem esquema (https:// por omissão). */
export function normalizeUrl(raw: string): string {
  const url = raw.trim()
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

/** Extrai o domínio para mostrar de forma amigável. */
export function prettyHost(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export async function fetchLinks(): Promise<LinkItem[]> {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as LinkItem[]
}

export interface LinkInput {
  title: string
  url: string
  description: string | null
  created_by: string | null
}

export async function createLink(input: LinkInput): Promise<void> {
  const { error } = await supabase.from('links').insert({
    title: input.title.trim(),
    url: normalizeUrl(input.url),
    description: input.description?.trim() || null,
    created_by: input.created_by,
    position: Date.now(),
  })
  if (error) throw error
}

export async function updateLink(
  id: string,
  patch: Omit<LinkInput, 'created_by'>,
): Promise<void> {
  const { error } = await supabase
    .from('links')
    .update({
      title: patch.title.trim(),
      url: normalizeUrl(patch.url),
      description: patch.description?.trim() || null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase.from('links').delete().eq('id', id)
  if (error) throw error
}
