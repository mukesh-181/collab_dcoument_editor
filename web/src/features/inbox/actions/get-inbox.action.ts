'use server'

import { createClient } from '@/lib/supabase/server'

export async function getInbox() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return []

  const { data: invites, error } = await supabase
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
    `)
    .eq('email', user.email)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching inbox:', error)
    return []
  }

  return invites || []
}
