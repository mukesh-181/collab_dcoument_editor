'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createDocument(formData: FormData) {
  const supabase = await createClient()

  // Extract title or default to 'Untitled Document'
  const title = (formData.get('title') as string)?.trim() || 'Untitled Document';

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // 2. Insert into documents table
  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert({
      title: title,
      owner_id: user.id,
    })
    .select()
    .single()

  if (docError || !document) {
    console.error('Error creating document:', docError)
    throw new Error('Failed to create document')
  }

  // 3. Insert into document_members table
  const { error: memberError } = await supabase
    .from('document_members')
    .insert({
      document_id: document.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    console.error('Error adding document owner:', memberError)
    // Cleanup the orphaned document if member creation fails
    await supabase.from('documents').delete().eq('id', document.id)
    throw new Error('Failed to assign document ownership')
  }

  // 4. Return the new document ID
  revalidatePath('/dashboard')
  return document.id
}

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

export async function deleteDocument(documentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify ownership before deleting
  const { data: member } = await supabase
    .from('document_members')
    .select('role')
    .eq('document_id', documentId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'owner') {
    throw new Error('Only the owner can delete this document')
  }

  // Soft delete
  const { error } = await supabase
    .from('documents')
    .update({ is_deleted: true })
    .eq('id', documentId)

  if (error) {
    console.error('Error deleting document:', error)
    throw new Error('Failed to delete document')
  }

  revalidatePath('/dashboard')
}

export async function updateDocumentTitle(documentId: string, title: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify membership (owners and editors should be able to rename)
  const { data: member } = await supabase
    .from('document_members')
    .select('role')
    .eq('document_id', documentId)
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
    throw new Error('You do not have permission to rename this document')
  }

  const newTitle = title.trim() || 'Untitled Document'

  const { error } = await supabase
    .from('documents')
    .update({ title: newTitle })
    .eq('id', documentId)

  if (error) {
    console.error('Error updating document title:', error)
    throw new Error('Failed to update document title')
  }

  revalidatePath(`/dashboard/${documentId}`)
  revalidatePath('/dashboard')
}

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
