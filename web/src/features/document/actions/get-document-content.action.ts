'use server'

import { createClient } from '@/lib/supabase/server'

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
