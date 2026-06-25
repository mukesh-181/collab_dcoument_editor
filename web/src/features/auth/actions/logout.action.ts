'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from "@/constants/routes";

export async function logout(scope: 'local' | 'global' | 'others' = 'local') {
  const supabase = await createClient()

  if (scope === 'others') {
    // @supabase/ssr adapter aggressively clears cookies on ANY signOut call.
    // We must capture the session first and restore it to prevent local logout.
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.auth.signOut({ scope })
    
    if (session) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    }
    return;
  }

  await supabase.auth.signOut({ scope })
  revalidatePath('/', 'layout')
  redirect(ROUTES.LOGIN)
}
