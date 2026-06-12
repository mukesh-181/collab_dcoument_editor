'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendEmailInvites(documentId: string, emails: string[], role: 'viewer' | 'editor') {
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

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() +  24)
  const expiresAtISO = expiresAt.toISOString()

  const invitesToInsert = emails.map(email => ({
    document_id: documentId,
    email: email,
    role: role,
    token: crypto.randomUUID(),
    status: 'pending',
    expires_at: expiresAtISO
  }))

  const { error } = await supabase
    .from('invites')
    .insert(invitesToInsert)

  if (error) {
    console.error('Error creating email invites:', error)
    throw new Error('Failed to send invites')
  }

  return { success: true }
}
