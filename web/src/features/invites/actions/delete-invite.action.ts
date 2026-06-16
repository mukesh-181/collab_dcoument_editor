'use server'

import { createClient } from '@/lib/supabase/server'

import { revalidatePath } from 'next/cache'

export async function deleteInvite(inviteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) throw new Error('Unauthorized')

  // Verify the invite belongs to the user
  const { data: invite } = await supabase
    .from('invites')
    .select('email')
    .eq('id', inviteId)
    .single()

  if (!invite || invite.email !== user.email) {
    throw new Error('Unauthorized or invite not found')
  }

  const { error } = await supabase
    .from('invites')
    .delete()
    .eq('id', inviteId)

  if (error) throw new Error('Failed to delete invite')
  
  revalidatePath('/dashboard/inbox')
  revalidatePath('/dashboard')
  return { success: true }
}
