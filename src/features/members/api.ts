import { supabase } from '@/lib/supabase'
import type { Area, Member, Role } from '@/types/database'

export async function fetchMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('role', { ascending: true }) // 'leader' antes de 'member'
    .order('name', { ascending: true })
  if (error) throw error
  return data as Member[]
}

export async function fetchAreas(): Promise<Area[]> {
  const { data, error } = await supabase
    .from('areas')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data as Area[]
}

export interface NewMember {
  name: string
  email: string
  role: Role
  area: string | null
  contact: string | null
}

export async function addMember(input: NewMember): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .insert({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      area: input.area,
      contact: input.contact?.trim() || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Member
}

export async function setMemberActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('members').update({ active }).eq('id', id)
  if (error) throw error
}
