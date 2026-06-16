'use server'

import { createClient } from '@/lib/supabase/server'
import { yDocToProsemirrorJSON } from 'y-prosemirror'
import * as Y from 'yjs'

interface GetDocumentsOptions {
  search?: string;
  page?: number;
  filter?: string;
  limit?: number;
}

export async function getUserDocuments(options?: GetDocumentsOptions) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { documents: [], totalCount: 0, totalPages: 0 }

  const search = options?.search || ''
  const page = options?.page || 1
  const filter = options?.filter || 'all'
  const limit = options?.limit || 6

  let query = supabase
    .from('documents')
    .select(`
      *,
      document_members!inner(role, user_id),
      all_members:document_members(
        role,
        user:users(id, name, image, email)
      ),
      owner:users!documents_owner_id_fkey(name),
      document_content_state(ydoc_state)
    `, { count: 'exact' })
    .eq('is_deleted', false)
    .eq('document_members.user_id', user.id)

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (filter === 'owned-by-me') {
    query = query.eq('document_members.role', 'owner')
  } else if (filter === 'owned-by-others') {
    query = query.neq('document_members.role', 'owner')
  } else if (filter === 'editor') {
    query = query.eq('document_members.role', 'editor')
  } else if (filter === 'viewer') {
    query = query.eq('document_members.role', 'viewer')
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data: documents, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.warn('Error fetching documents:', error)
    return { documents: [], totalCount: 0, totalPages: 0 }
  }

  const totalPages = Math.max(1, Math.ceil((count || 0) / limit))

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

  return {
    documents: processedDocuments,
    totalCount: count || 0,
    totalPages
  }
}
