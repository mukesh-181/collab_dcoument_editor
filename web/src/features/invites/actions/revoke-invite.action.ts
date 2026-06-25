'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function revokeInviteAction(inviteId: string, documentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if current user is owner of the document
  const { data: document } = await supabase
    .from('documents')
    .select('owner_id')
    .eq('id', documentId)
    .single()

  if (!document || document.owner_id !== user.id) {
    return { error: 'Only the document owner can revoke invites' }
  }

  // First update to trigger a realtime event that passes RLS 
  // (DELETE events often fail RLS without replica identity full)
  await supabase
    .from('invites')
    .update({ status: 'rejected' })
    .eq('id', inviteId)
    .eq('document_id', documentId)

  // Delete the invite
  const { error: deleteError } = await supabase
    .from('invites')
    .delete()
    .eq('id', inviteId)
    .eq('document_id', documentId)

  if (deleteError) {
    console.error('Error revoking invite:', deleteError)
    return { error: 'Failed to revoke invite' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
