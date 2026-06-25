'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ROUTES } from "@/constants/routes";

export async function removeMemberAction(documentId: string, memberId: string, memberEmail: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if current user is owner
  const { data: document } = await supabase
    .from('documents')
    .select('owner_id')
    .eq('id', documentId)
    .single()

  if (!document || document.owner_id !== user.id) {
    return { error: 'Only the document owner can remove members' }
  }

  // Delete from document_members
  const { error: deleteError } = await supabase
    .from('document_members')
    .delete()
    .eq('document_id', documentId)
    .eq('user_id', memberId)

  if (deleteError) {
    console.error('Error removing member:', deleteError)
    return { error: 'Failed to remove member' }
  }

  // Insert notification into invites table
  const token = crypto.randomUUID()
  const { error: inviteError } = await supabase
    .from('invites')
    .insert({
      document_id: documentId,
      email: memberEmail,
      role: 'viewer', // arbitrary since it's just a notification
      status: 'removed',
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })

  if (inviteError) {
    console.error('Error inserting removal notification:', inviteError)
  }

  // Log activity
  await supabase
    .from('document_activity')
    .insert({
      document_id: documentId,
      actor_id: user.id, // owner
      target_user_id: memberId,
      action_type: 'member_removed',
    })

  revalidatePath(ROUTES.DOCUMENT(documentId))
  return { success: true }
}
