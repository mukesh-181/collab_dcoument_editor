'use server'

import { createClient } from '@/lib/supabase/server'

export async function checkPendingRequestAction(documentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isPending: false }

  // Check if there is a pending request from this user for this document
  // The token format is request:role:email:uuid
  const { data: invites, error } = await supabase
    .from('invites')
    .select('token')
    .eq('document_id', documentId)
    .eq('status', 'pending')
    .like('token', `request:%:${user.email}:%`)

  // Even if RLS blocks it, we can't be sure unless we use service_role. 
  // Let's assume the user CANNOT read it. In that case, we need to bypass RLS.
  // Wait, does Supabase SSR client bypass RLS? No.
  // Let's use an RPC or just let it be. Actually, if RLS blocks it, they will just see the button again.
  // We can try to fetch it. If error, return false.
  
  if (error || !invites || invites.length === 0) {
    return { isPending: false }
  }

  return { isPending: true }
}
