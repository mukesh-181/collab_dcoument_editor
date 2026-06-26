'use server'

import { cookies } from 'next/headers'

export async function markInboxAsReadAction() {
  const cookieStore = await cookies()
  const prev = cookieStore.get('last_inbox_read_at')?.value || '1970-01-01T00:00:00.000Z'
  cookieStore.set('last_inbox_read_at', new Date().toISOString(), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
  return { success: true, prevReadAt: prev }
}
