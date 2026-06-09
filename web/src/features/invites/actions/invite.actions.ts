'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInviteLink(documentId: string, role: 'viewer' | 'editor') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify the current user is an owner or editor
  const { data: member } = await supabase
    .from('document_members')
    .select('role')
    .eq('document_id', documentId)
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
    throw new Error('You do not have permission to invite users to this document')
  }

  // Generate a unique token
  const token = crypto.randomUUID()

  const { data, error } = await supabase
    .from('invites')
    .insert({
      document_id: documentId,
      role: role,
      token: token,
      status: 'pending'
    })
    .select('token')
    .single()

  if (error || !data) {
    console.error('Error creating invite:', error)
    throw new Error('Failed to create invite link')
  }

  return data.token
}

export async function getInviteDetails(token: string) {
  const supabase = await createClient()

  const { data: invite, error } = await supabase
    .from('invites')
    .select(`
      id,
      status,
      role,
      documents (
        title,
        owner:users!documents_owner_id_fkey (
          name
        )
      )
    `)
    .eq('token', token)
    .single()

  if (error || !invite) {
    throw new Error('Invalid invite link')
  }

  if (invite.status !== 'pending') {
    throw new Error('This invite link has already been used')
  }

  // Handle potentially nested array returns from Supabase joins
  const documentInfo = Array.isArray(invite.documents) ? invite.documents[0] : invite.documents;
  const ownerInfo = Array.isArray(documentInfo?.owner) ? documentInfo.owner[0] : documentInfo?.owner;

  return {
    documentTitle: documentInfo?.title || 'Unknown Document',
    ownerName: ownerInfo?.name || 'Unknown User',
    role: invite.role
  }
}

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
