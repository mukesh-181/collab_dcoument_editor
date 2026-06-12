'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateDocumentContent(documentId: string, contentHTML: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify membership (owners and editors can edit)
  const { data: member } = await supabase
    .from('document_members')
    .select('role')
    .eq('document_id', documentId)
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
    throw new Error('You do not have permission to edit this document')
  }

  // Upsert into document_content_state
  const { error } = await supabase
    .from('document_content_state')
    .upsert({
      document_id: documentId,
      ydoc_state: contentHTML,
      updated_at: new Date().toISOString()
    }, { onConflict: 'document_id' })

  if (error) {
    console.error('Error updating document content:', error)
    throw new Error('Failed to update document content')
  }
}
