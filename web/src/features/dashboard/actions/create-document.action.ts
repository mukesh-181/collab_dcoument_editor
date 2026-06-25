'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ROUTES } from "@/constants/routes";

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

  // 4. Log document creation activity
  const { error: activityError } = await supabase
    .from('document_activity')
    .insert({
      document_id: document.id,
      actor_id: user.id,
      action_type: 'document_created',
      metadata: { role: 'owner' },
    })

  if (activityError) {
    console.error('Error logging activity:', activityError)
  }

  // 5. Return the new document ID
  revalidatePath(ROUTES.DASHBOARD)
  return document.id
}
