'use server'

import { createClient } from '@/lib/supabase/server'
import { yDocToProsemirrorJSON } from 'y-prosemirror'
import * as Y from 'yjs'

export async function getUserDocuments() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: documents, error } = await supabase
    .from('documents')
    .select(`
      *,
      document_members!inner(role),
      all_members:document_members(
        role,
        user:users(id, name, image, email)
      ),
      owner:users!documents_owner_id_fkey(name),
      document_content_state(ydoc_state)
    `)
    .eq('is_deleted', false)
    .eq('document_members.user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.warn('Error fetching documents:', error)
    return []
  }

  // Process the documents to extract a JSON preview from the binary Yjs state
  const processedDocuments = documents.map((doc: any) => {
    let previewJson = null
    
    // Check if there is a content state (Supabase might return an array or object depending on relation)
    const docState = Array.isArray(doc.document_content_state) 
      ? doc.document_content_state[0] 
      : doc.document_content_state
    
    if (docState?.ydoc_state) {
      try {
        const buffer = Buffer.from(docState.ydoc_state, 'base64')
        const yDoc = new Y.Doc()
        Y.applyUpdate(yDoc, buffer)
        
        // Convert Y.Doc directly to Prosemirror JSON tree to preserve formatting
        previewJson = yDocToProsemirrorJSON(yDoc, 'default')
      } catch (err) {
        // Use console.warn instead of console.error to prevent Next.js dev overlay interruptions
        console.warn(`Failed to generate preview JSON for doc ${doc.id}`)
      }
    }

    // Remove the heavy binary data before sending to the client component
    delete doc.document_content_state

    return {
      ...doc,
      previewJson
    }
  })

  return processedDocuments
}
