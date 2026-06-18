'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDocumentById(documentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: document, error } = await supabase
    .from('documents')
    .select(`
      *,
      document_members!inner(role),
      all_members:document_members(role, user:users(id, name, image, email)),
      invites(email, status, expires_at)
    `)
    .eq('id', documentId)
    .eq('is_deleted', false)
    .eq('document_members.user_id', user.id)
    .single()

  if (error || !document) {
    return null
  }

  if (document.invites) {
    const pendingInvites = document.invites.filter((inv: Record<string, unknown>) => inv.status === 'pending')
    
    // Enrich pending invites with user details if they are registered
    if (pendingInvites.length > 0) {
      const emails = pendingInvites.map((inv: Record<string, unknown>) => inv.email)
      const { data: registeredUsers } = await supabase
        .from('users')
        .select('email, name, image')
        .in('email', emails)
        
      if (registeredUsers && registeredUsers.length > 0) {
        pendingInvites.forEach((inv: Record<string, unknown>) => {
          const match = registeredUsers.find((u) => u.email === inv.email)
          if (match) {
            inv.name = match.name
            inv.image = match.image
          }
        })
      }
    }
    document.invites = pendingInvites
  }

  return document
}
