'use server'

import { createClient } from '@/lib/supabase/server'

export async function searchUsersByEmail(query: string) {
  if (!query || query.length < 2) {
    return []
  }

  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, image')
    .ilike('email', `%${query}%`)
    .limit(7)

  if (error) {
    console.error('Error searching users:', error)
    return []
  }

  return users || []
}
