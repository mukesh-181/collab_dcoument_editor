'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUnreadCount() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return 0

  const { count, error } = await supabase
    .from('invites')
    .select('*', { count: 'exact', head: true })
    .eq('email', user.email)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }

  return count || 0
}
