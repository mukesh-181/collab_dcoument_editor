'use server'

import { createClient } from '@/lib/supabase/server'

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

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  const { error } = await supabase
    .from('invites')
    .insert({
      document_id: documentId,
      role: role,
      token: token,
      status: 'pending',
      expires_at: expiresAt.toISOString()
    })

  if (error) {
    console.error('Error creating invite:', error)
    throw new Error('Failed to create invite link')
  }

  return token
}
