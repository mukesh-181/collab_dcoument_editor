'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
