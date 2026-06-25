'use server'

import { createClient } from '@/lib/supabase/server'
import { forgotPasswordSchema, ForgotPasswordInput } from '../schemas/auth.schema'
import { ENV } from '@/constants/env'

export async function requestPasswordReset(data: ForgotPasswordInput) {
  const parsed = forgotPasswordSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Invalid input data' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${ENV.NEXT_PUBLIC_APP_URL}/auth/callback?next=/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
