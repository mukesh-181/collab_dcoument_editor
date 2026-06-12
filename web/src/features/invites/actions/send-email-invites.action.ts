'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendEmailInvites(documentId: string, emails: string[], role: 'viewer' | 'editor') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Filter out the user's own email
  const uniqueEmails = Array.from(new Set(emails))
  const emailsToProcess = uniqueEmails.filter(
    (email) => email.toLowerCase() !== user.email?.toLowerCase()
  )

  if (emailsToProcess.length === 0) {
    if (uniqueEmails.length > 0) {
      throw new Error("You cannot invite yourself.")
    }
    throw new Error("No valid emails provided.")
  }

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

  // Fetch existing pending invites for the selected emails
  const { data: existingInvites } = await supabase
    .from('invites')
    .select('email, role, expires_at')
    .eq('document_id', documentId)
    .in('status', ['pending', 'accepted'])
    .in('email', emailsToProcess)

  const now = new Date()

  // Filter out emails that already have an active invite or are members
  const finalEmailsToInvite = emailsToProcess.filter((email) => {
    const existing = existingInvites?.find(
      (inv) => inv.email.toLowerCase() === email.toLowerCase()
    )
    if (existing) {
      const expiresAt = new Date(existing.expires_at)
      if (expiresAt > now) {
        return false // Active invite for same document exists
      }
    }
    return true
  })

  if (finalEmailsToInvite.length === 0) {
    throw new Error("The selected users already have an active invitation or are already members of this document.")
  }

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)
  const expiresAtISO = expiresAt.toISOString()

  const invitesToInsert = finalEmailsToInvite.map(email => ({
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
