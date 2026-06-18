'use server'

import { createClient } from '@/lib/supabase/server'
import { FilterType } from '../components/inbox-client-list'

export async function getInbox(
  page: number = 0,
  limit: number = 15,
  filter: FilterType = "all"
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { data: [], count: 0 }

  let query = supabase
    .from('invites')
    .select(`
      id,
      token,
      document_id,
      role,
      status,
      created_at,
      expires_at,
      documents (
        title,
        owner:users!documents_owner_id_fkey(name, email, image)
      )
    `, { count: 'exact' })
    .eq('email', user.email)

  // Apply server-side filtering
  if (filter === "invites") {
    query = query.in('status', ["pending", "accepted", "rejected", "expired"]);
  } else if (filter === "document") {
    query = query.in('status', ["role_updated", "removed", "exited"]);
  }

  // Apply pagination
  const from = page * limit
  const to = from + limit - 1
  
  const { data: invites, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching inbox:', error)
    return { data: [], count: 0 }
  }

  // DEBUG: log first item to inspect actual Supabase shape
  if (invites && invites.length > 0) {
    console.log('[inbox] first invite raw:', JSON.stringify(invites[0], null, 2));
  }

  return { data: invites || [], count: count || 0 }
}
