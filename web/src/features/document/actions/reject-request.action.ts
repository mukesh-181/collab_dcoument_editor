'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function rejectRoleRequestAction(inviteId: string) {
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
    return { error: 'Unauthorized to reject' }
  }

  const requesterEmail = invite.token.split(':')[2]

  // 2. Update the request status to rejected
  await supabase
    .from('invites')
    .update({ status: 'rejected' })
    .eq('id', inviteId)

  // 3. Send rejection notification to requester (we can use removed status as a generic rejection or add custom status if DB allows, but let's use removed with a specific token or just rejected)
  // Wait, if we send 'rejected', it will show up as "Rejected" in requester's inbox. But if token says request:, we can render it as "Request denied".
  const notificationToken = `request-denied:${crypto.randomUUID()}`
  await supabase
    .from('invites')
    .insert({
      document_id: invite.document_id,
      email: requesterEmail,
      role: invite.role, // role they asked for
      status: 'rejected',
      token: notificationToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

  revalidatePath('/dashboard/inbox')
  return { success: true }
}
