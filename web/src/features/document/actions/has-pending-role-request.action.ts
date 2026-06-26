'use server'

import { createClient } from '@/lib/supabase/server'

export async function hasPendingRoleRequestAction(documentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if there's any invite with a token matching this user's email and request format
  const { data: invites, error } = await supabase
    .from('invites')
    .select('token, status')
    .eq('document_id', documentId)
    .eq('status', 'pending')

  if (error || !invites) return { hasPending: false }

  const hasRequest = invites.some(inv => inv.token.startsWith(`request:editor:${user.email}:`))

  return { hasPending: hasRequest }
}
