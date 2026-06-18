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
    document.invites = document.invites.filter((inv: Record<string, unknown>) => inv.status === 'pending')
  }

  return document
}
