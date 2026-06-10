'use server'

import { createClient } from '@/lib/supabase/server'

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
