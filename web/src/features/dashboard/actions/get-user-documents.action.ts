'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserDocuments() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // We query documents where the user is a member and it's not soft-deleted.
  // Using an inner join to only fetch documents the user has access to.
  const { data: documents, error } = await supabase
    .from('documents')
    .select(`
      *,
      document_members!inner(role),
      owner:users!documents_owner_id_fkey(name)
    `)
    .eq('is_deleted', false)
    .eq('document_members.user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }

  return documents
}
