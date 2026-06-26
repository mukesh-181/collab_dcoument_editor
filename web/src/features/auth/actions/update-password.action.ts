'use server'

import { createClient } from '@/lib/supabase/server'
import { updatePasswordSchema, UpdatePasswordInput } from '../schemas/auth.schema'
import { revalidatePath } from 'next/cache'

export async function updatePassword(data: UpdatePasswordInput) {
  const parsed = updatePasswordSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Invalid input data' }
  }

  const supabase = await createClient()

  // Verify the user is authenticated (callback should have logged them in)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'You are not authorized to perform this action. Your reset link may have expired.' }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
