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
      document_members!inner(role)
    `)
    .eq('id', documentId)
    .eq('is_deleted', false)
    .eq('document_members.user_id', user.id)
    .single()

  if (error || !document) {
    return null
  }

  return document
}

export async function getDocumentContent(documentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_content_state')
    .select('ydoc_state')
    .eq('document_id', documentId)
    .single()

  if (error || !data) {
    return ''
  }

  return data.ydoc_state || ''
}
