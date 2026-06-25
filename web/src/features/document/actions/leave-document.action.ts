'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ROUTES } from "@/constants/routes";

export async function leaveDocumentAction(documentId: string, ownerEmail: string, currentUserName: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if current user is owner
  const { data: document } = await supabase
    .from('documents')
    .select('owner_id')
    .eq('id', documentId)
    .single()

  if (!document) {
    return { error: 'Document not found' }
  }

  if (document.owner_id === user.id) {
    return { error: 'The document owner cannot leave the document' }
  }

  // Delete current user from document_members
  const { error: deleteError } = await supabase
    .from('document_members')
    .delete()
    .eq('document_id', documentId)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Error leaving document:', deleteError)
    return { error: 'Failed to leave document' }
  }

  // Insert notification into invites table for the OWNER
  const { error: inviteError } = await supabase
    .from('invites')
    .insert({
      document_id: documentId,
      email: ownerEmail,
      role: 'viewer', // arbitrary
      status: 'exited',
      token: currentUserName, // storing the leaving user's name as the token!
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })

  if (inviteError) {
    console.error('Error inserting leave notification:', inviteError)
  }

  // Log activity
  await supabase
    .from('document_activity')
    .insert({
      document_id: documentId,
      actor_id: user.id,
      action_type: 'member_left',
    })

  revalidatePath(ROUTES.DASHBOARD)
  return { success: true }
}
