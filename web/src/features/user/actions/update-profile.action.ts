"use server"

import { createClient } from "@/lib/supabase/server"
import { updateProfileSchema, type UpdateProfileInput } from "../schemas/user.schema"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: UpdateProfileInput) {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "You must be logged in to update your profile." }
  }

  // 2. Validate input
  const parsed = updateProfileSchema.safeParse({ name: data.name })
  if (!parsed.success) {
    return { error: "Invalid name format." }
  }

  // 3. Update auth metadata and users table
  const updatePayload: Record<string, unknown> = { full_name: parsed.data.name }
  if (data.avatar_url !== undefined) {
    updatePayload.avatar_url = data.avatar_url
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: updatePayload
  })

  if (updateError) {
    return { error: updateError.message }
  }

  // 4. Update the public.users table so document queries reflect the changes
  const dbPayload: Record<string, unknown> = { name: parsed.data.name }
  if (data.avatar_url !== undefined) {
    dbPayload.image = data.avatar_url
  }

  const { error: dbError } = await supabase
    .from('users')
    .update(dbPayload)
    .eq('id', user.id)

  if (dbError) {
    // If the database update fails, it's a critical error
    return { error: dbError.message }
  }

  revalidatePath("/", "layout")
  
  return { success: true }
}
