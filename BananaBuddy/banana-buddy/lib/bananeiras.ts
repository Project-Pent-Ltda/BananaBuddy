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
  topSport: string | null
  streak: number
  longestStreak: number
  shields: number
  lastActivityDate: string | null
}

export function sportSessionsTotal(practiced: Record<string, number> | null): number {
  if (!practiced) return 0
  return Object.values(practiced).reduce((a, b) => a + b, 0)
}

export function topSportOf(practiced: Record<string, number> | null): string | null {
  if (!practiced) return null
  const entries = Object.entries(practiced).filter(([, v]) => v > 0)
  if (entries.length === 0) return null
  return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0]
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
    .select('id, buddy_name, active_skin, is_on_fire, practiced_sports, current_streak, longest_streak, streak_shields, last_activity_date')
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
      topSport: topSportOf(profile?.practiced_sports),
      streak: profile?.current_streak ?? 0,
      longestStreak: profile?.longest_streak ?? 0,
      shields: profile?.streak_shields ?? 0,
      lastActivityDate: profile?.last_activity_date ?? null,
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

export async function redeemPendingPokes(): Promise<number> {
  const { data, error } = await supabase.rpc('redeem_pending_pokes')
  if (error) throw error
  return (data as number) ?? 0
}

export async function fetchUnseenRescues(): Promise<{ id: string; rescuedName: string; bonus: number }[]> {
  const { data, error } = await supabase
    .from('rescue_notifications')
    .select('id, rescued_name, bonus')
    .eq('seen', false)
  if (error) throw error
  return (data ?? []).map((r: any) => ({ id: r.id, rescuedName: r.rescued_name, bonus: r.bonus }))
}

export async function markRescuesSeen(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('rescue_notifications').update({ seen: true }).in('id', ids)
  if (error) throw error
}

export async function registerResurrection(bananeiraId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('register_resurrection', { p_bananeira_id: bananeiraId })
  if (error) throw error
  return data as boolean
}

export async function fetchUnseenResurrections(): Promise<{ id: string; fromName: string; bananeiraNome: string }[]> {
  const { data, error } = await supabase
    .from('resurrection_notifications')
    .select('id, from_name, bananeira_name')
    .eq('seen', false)
  if (error) throw error
  return (data ?? []).map((r: any) => ({ id: r.id, fromName: r.from_name, bananeiraNome: r.bananeira_name }))
}

export async function markResurrectionsSeen(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('resurrection_notifications').update({ seen: true }).in('id', ids)
  if (error) throw error
}

// ============================================================
// Check-ins (feed com foto de prova)
// ============================================================

export type CheckinInput = {
  sportId: string
  photoDataUrl: string
  title: string
  description: string
  duracao: string
  distancia: string
  calorias: string
  passos: string
}

export type FeedCheckin = {
  id: string
  authorId: string
  authorName: string
  authorSkin: string
  sportId: string
  photoUrl: string
  title: string
  description: string
  duracao: string
  distancia: string
  calorias: string
  passos: string
  createdAt: string
}

// Faz upload da foto para o Storage e cria o registro do check-in.
export async function createCheckin(input: CheckinInput): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Não autenticado')

  // dataURL -> Blob para o upload
  const blob = await (await fetch(input.photoDataUrl)).blob()
  const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('checkins')
    .upload(path, blob, { contentType: blob.type, upsert: false })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('checkins').getPublicUrl(path)

  const { error: insertError } = await supabase.from('checkins').insert({
    author_id: userId,
    sport_id: input.sportId,
    photo_url: urlData.publicUrl,
    title: input.title,
    description: input.description,
    duracao: input.duracao,
    distancia: input.distancia,
    calorias: input.calorias,
    passos: input.passos,
  })
  if (insertError) throw insertError
}

// Feed de uma Bananeira: check-ins de todos os membros, mais recentes primeiro.
export async function fetchBananeiraFeed(bananeiraId: string, limit = 30): Promise<FeedCheckin[]> {
  const { data: memberRows, error: membersError } = await supabase
    .from('bananeira_members')
    .select('user_id')
    .eq('bananeira_id', bananeiraId)
  if (membersError) throw membersError

  const userIds = (memberRows ?? []).map((row) => row.user_id as string)
  if (userIds.length === 0) return []

  const { data: checkinRows, error: checkinsError } = await supabase
    .from('checkins')
    .select('*')
    .in('author_id', userIds)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (checkinsError) throw checkinsError
  if (!checkinRows || checkinRows.length === 0) return []

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, buddy_name, active_skin')
    .in('id', userIds)
  const profileById = new Map((profileRows ?? []).map((p: any) => [p.id as string, p]))

  return checkinRows.map((c: any) => {
    const profile = profileById.get(c.author_id)
    return {
      id: c.id,
      authorId: c.author_id,
      authorName: profile?.buddy_name || 'Banana',
      authorSkin: profile?.active_skin || 'base',
      sportId: c.sport_id,
      photoUrl: c.photo_url,
      title: c.title ?? '',
      description: c.description ?? '',
      duracao: c.duracao ?? '',
      distancia: c.distancia ?? '',
      calorias: c.calorias ?? '',
      passos: c.passos ?? '',
      createdAt: c.created_at,
    }
  })
}
