'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserName, getUserImage, getUserEmail, getUserRole, USER_FALLBACKS } from "@/utils/user-utils";


export async function getInviteDetails(token: string, userId?: string) {
  const supabase = await createClient()

  const { data: invite, error } = await supabase
    .from('invites')
    .select(`
      id,
      status,
      role,
      document_id,
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

  let isAlreadyMember = false

  if (userId) {
    const { data: existingMember } = await supabase
      .from('document_members')
      .select('role')
      .eq('document_id', invite.document_id)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      isAlreadyMember = true
    }
  }

  if (invite.status !== 'pending' && !isAlreadyMember) {
    throw new Error('This invite link has already been used or expired.')
  }

  // Handle potentially nested array returns from Supabase joins
  const documentInfo = Array.isArray(invite.documents) ? invite.documents[0] : invite.documents;
  const ownerInfo = Array.isArray(documentInfo?.owner) ? documentInfo.owner[0] : documentInfo?.owner;

  return {
    documentTitle: documentInfo?.title || 'Unknown Document',
    ownerName: getUserName(ownerInfo?.name),
    role: invite.role,
    documentId: invite.document_id,
    isAlreadyMember
  }
}
