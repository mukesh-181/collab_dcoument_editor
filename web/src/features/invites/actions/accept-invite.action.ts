'use server'

import { createClient } from '@/lib/supabase/server'

export async function acceptInvite(token: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Find the pending invite
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('id, document_id, role, status')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    throw new Error('Invalid or expired invite link')
  }

  if (invite.status !== 'pending') {
    throw new Error('This invite link has already been used')
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('document_members')
    .select('role')
    .eq('document_id', invite.document_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    // If they are already a member, we just return the document_id
    // Optionally we could upgrade their role if the invite is 'editor' and they are 'viewer'
    // but for now, just let them in.
    return invite.document_id
  }

  // Add the user to document_members
  const { error: memberError } = await supabase
    .from('document_members')
    .insert({
      document_id: invite.document_id,
      user_id: user.id,
      role: invite.role
    })

  if (memberError) {
    console.error('Error adding user to document:', memberError)
    throw new Error('Failed to join the document')
  }

  // Mark the invite as accepted
  await supabase
    .from('invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id)

  return invite.document_id
}
