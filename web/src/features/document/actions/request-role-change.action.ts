'use server'

import { createClient } from '@/lib/supabase/server'

export async function requestRoleChangeAction(documentId: string, requestedRole: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Since there is no role_requests table, we will just simulate a success response.
  // In a real application, you would insert a row into a requests table.
  
  // Just verify they are a member
  const { data: member } = await supabase
    .from('document_members')
    .select('role')
    .eq('document_id', documentId)
    .eq('user_id', user.id)
    .single()

  if (!member) return { error: 'Not a member' }

  // Get document owner email
  const { data: document } = await supabase
    .from('documents')
    .select('owner:users!documents_owner_id_fkey(email)')
    .eq('id', documentId)
    .single()

  const ownerData = Array.isArray(document?.owner) ? document.owner[0] : document?.owner
  const ownerEmail = ownerData?.email
  if (!ownerEmail) return { error: 'Document owner not found' }

  // Insert a request invite for the owner
  // The token encodes the requester's email so the owner knows who requested it
  const token = `request:${requestedRole}:${user.email}:${crypto.randomUUID()}`
  
  const { error: inviteError } = await supabase
    .from('invites')
    .insert({
      document_id: documentId,
      email: ownerEmail,
      role: requestedRole,
      status: 'pending',
      token,
      expires_at: null
    })

  if (inviteError) {
    console.error('Error inserting role request:', inviteError)
    return { error: 'Failed to send request' }
  }

  return { success: true }
}
