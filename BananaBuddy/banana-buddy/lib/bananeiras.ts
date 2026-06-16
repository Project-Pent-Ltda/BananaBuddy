import { supabase } from './supabase'

export type BananeiraOverview = {
  id: string
  name: string
  code: string
  founder_id: string
  member_count: number
}

export type BananeiraMember = {
  userId: string
  name: string
  skin: string
  isOnFire: boolean
  score: number
}

function sportSessionsTotal(practiced: Record<string, number> | null): number {
  if (!practiced) return 0
  return Object.values(practiced).reduce((a, b) => a + b, 0)
}

export async function fetchMyBananeiras(): Promise<BananeiraOverview[]> {
  const { data, error } = await supabase.from('bananeira_overview').select('*')
  if (error) throw error
  return data ?? []
}

export async function createBananeira(name: string): Promise<{ id: string; code: string }> {
  const { data, error } = await supabase.rpc('create_bananeira', { p_name: name })
  if (error) throw error
  return data as { id: string; code: string }
}

export async function joinBananeira(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_bananeira', { p_code: code })
  if (error) throw error
  return data as string
}

export async function fetchBananeiraMembers(bananeiraId: string): Promise<BananeiraMember[]> {
  const { data: memberRows, error: membersError } = await supabase
    .from('bananeira_members')
    .select('user_id')
    .eq('bananeira_id', bananeiraId)
  if (membersError) throw membersError

  const userIds = (memberRows ?? []).map((row) => row.user_id as string)
  if (userIds.length === 0) return []

  const { data: profileRows, error: profilesError } = await supabase
    .from('profiles')
    .select('id, buddy_name, active_skin, is_on_fire, practiced_sports')
    .in('id', userIds)
  if (profilesError) throw profilesError

  const profileById = new Map((profileRows ?? []).map((p: any) => [p.id as string, p]))

  const members = userIds.map((userId) => {
    const profile = profileById.get(userId)
    return {
      userId,
      name: profile?.buddy_name || 'Banana',
      skin: profile?.active_skin || 'base',
      isOnFire: !!profile?.is_on_fire,
      score: sportSessionsTotal(profile?.practiced_sports),
    }
  })

  return members.sort((a, b) => b.score - a.score)
}

export async function sendPoke(toUser: string, fromName: string, bananeiraId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const fromUser = auth.user?.id
  if (!fromUser) throw new Error('Não autenticado')
  const { error } = await supabase
    .from('pokes')
    .insert({ from_user: fromUser, to_user: toUser, from_name: fromName, bananeira_id: bananeiraId })
  if (error) throw error
}

export async function fetchUnseenPokes(): Promise<{ id: string; fromName: string }[]> {
  const { data, error } = await supabase
    .from('pokes')
    .select('id, from_name')
    .eq('seen', false)
  if (error) throw error
  return (data ?? []).map((p: any) => ({ id: p.id, fromName: p.from_name }))
}

export async function markPokesSeen(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('pokes').update({ seen: true }).in('id', ids)
  if (error) throw error
}
