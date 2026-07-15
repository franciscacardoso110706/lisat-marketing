import { supabase } from '@/lib/supabase'
import type { Sponsor, SponsorStage } from '@/types/database'

export async function fetchSponsors(): Promise<Sponsor[]> {
  // RLS: líder vê tudo; membro só se for da área "Sponsors".
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Sponsor[]
}

export interface SponsorInput {
  name: string
  contact: string | null
  owner_id: string | null
  stage: SponsorStage
  next_followup_date: string | null
  notes: string | null
}

export async function createSponsor(input: SponsorInput): Promise<void> {
  const { error } = await supabase.from('sponsors').insert({
    name: input.name.trim(),
    contact: input.contact?.trim() || null,
    owner_id: input.owner_id,
    stage: input.stage,
    next_followup_date: input.next_followup_date,
    notes: input.notes?.trim() || null,
    position: Date.now(),
  })
  if (error) throw error
}

export async function updateSponsor(id: string, patch: SponsorInput): Promise<void> {
  const { error } = await supabase
    .from('sponsors')
    .update({
      name: patch.name.trim(),
      contact: patch.contact?.trim() || null,
      owner_id: patch.owner_id,
      stage: patch.stage,
      next_followup_date: patch.next_followup_date,
      notes: patch.notes?.trim() || null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function updateSponsorStage(
  id: string,
  stage: SponsorStage,
): Promise<void> {
  const { error } = await supabase.from('sponsors').update({ stage }).eq('id', id)
  if (error) throw error
}

export async function deleteSponsor(id: string): Promise<void> {
  const { error } = await supabase.from('sponsors').delete().eq('id', id)
  if (error) throw error
}
