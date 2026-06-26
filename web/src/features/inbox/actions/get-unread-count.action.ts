'use server'

import { createClient } from '@/lib/supabase/server'

import { cookies } from 'next/headers'

export async function getUnreadCount() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return 0

  const cookieStore = await cookies()
  const lastReadCookie = cookieStore.get('last_inbox_read_at')
  const lastReadAt = lastReadCookie ? lastReadCookie.value : '1970-01-01T00:00:00.000Z'

  const { count, error } = await supabase
    .from('invites')
    .select('*', { count: 'exact', head: true })
    .eq('email', user.email)
    .gt('created_at', lastReadAt)

  if (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }

  return count || 0
}
