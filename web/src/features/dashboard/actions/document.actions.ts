'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createDocument() {
  const supabase = await createClient()

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // 2. Insert into documents table
  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert({
      title: 'Untitled Document',
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

  // 4. Redirect to the new document
  revalidatePath('/dashboard')
  redirect(`/dashboard/${document.id}`)
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
