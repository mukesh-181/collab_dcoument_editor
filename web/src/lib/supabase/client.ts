import { ENV } from '@/constants/env'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    ENV.SUPABASE_URL,
    ENV.SUPABASE_PUBLISHABLE_KEY
  )
}
