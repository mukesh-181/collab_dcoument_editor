'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ROUTES } from "@/constants/routes";

export async function updateMemberRoleAction(documentId: string, memberId: string, memberEmail: string, newRole: string) {
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
    return { error: 'Only the document owner can update roles' }
  }

  // Update role in document_members
  const { error: updateError } = await supabase
    .from('document_members')
    .update({ role: newRole })
    .eq('document_id', documentId)
    .eq('user_id', memberId)

  if (updateError) {
    console.error('Error updating member role:', updateError)
    return { error: 'Failed to update member role' }
  }

  // Mark any pending role requests from this user for this document as accepted
  await supabase
    .from('invites')
    .update({ status: 'accepted' })
    .eq('document_id', documentId)
    .like('token', `request:%:${memberEmail}:%`)
    .eq('status', 'pending')

  // Insert notification into invites table
  const token = crypto.randomUUID()
  const { error: inviteError } = await supabase
    .from('invites')
    .insert({
      document_id: documentId,
      email: memberEmail,
      role: newRole,
      status: 'role_updated',
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })

  if (inviteError) {
    console.error('Error inserting role update notification:', inviteError)
  }

  // Log activity
  await supabase
    .from('document_activity')
    .insert({
      document_id: documentId,
      actor_id: user.id, // owner
      target_user_id: memberId,
      action_type: 'role_updated',
      metadata: { new_role: newRole },
    })

  revalidatePath(ROUTES.DOCUMENT(documentId))
  return { success: true }
}
