'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function acceptRoleRequestAction(inviteId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Fetch the request invite
  const { data: invite } = await supabase
    .from('invites')
    .select('*')
    .eq('id', inviteId)
    .single()

  if (!invite || !invite.token.startsWith('request:')) {
    return { error: 'Invalid request' }
  }

  // Ensure current user is the owner
  const { data: document } = await supabase
    .from('documents')
    .select('owner_id')
    .eq('id', invite.document_id)
    .single()

  if (!document || document.owner_id !== user.id) {
    return { error: 'Unauthorized to accept' }
  }

  const requesterEmail = invite.token.split(':')[2]
  const role = invite.role

  // Get requester user ID
  const { data: requester } = await supabase
    .from('users')
    .select('id')
    .eq('email', requesterEmail)
    .single()

  if (!requester) return { error: 'Requester not found' }

  // 2. Update their role in document_members
  const { error: updateError } = await supabase
    .from('document_members')
    .update({ role })
    .eq('document_id', invite.document_id)
    .eq('user_id', requester.id)

  if (updateError) {
    return { error: 'Failed to update role' }
  }

  // 3. Update the request status to accepted
  await supabase
    .from('invites')
    .update({ status: 'accepted' })
    .eq('id', inviteId)

  // 4. Send notification to requester
  const notificationToken = crypto.randomUUID()
  await supabase
    .from('invites')
    .insert({
      document_id: invite.document_id,
      email: requesterEmail,
      role: role,
      status: 'role_updated',
      token: notificationToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

  // 5. Log activity
  await supabase
    .from('document_activity')
    .insert({
      document_id: invite.document_id,
      actor_id: user.id, // owner
      target_user_id: requester.id,
      action_type: 'role_updated',
      metadata: { new_role: role },
    })

  revalidatePath('/dashboard/inbox')
  return { success: true }
}
