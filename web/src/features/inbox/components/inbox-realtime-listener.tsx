'use client'

import { useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function InboxRealtimeListener({ onNewEvent }: { onNewEvent?: () => void }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let isMounted = true
    let channel: ReturnType<typeof supabase.channel>

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted || !user?.email) return

      // Use a unique channel name per mount to completely avoid collision in React Strict Mode
      const channelName = `inbox-changes-${crypto.randomUUID()}`
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'invites',
            filter: `email=eq.${user.email}`,
          },
          (payload) => {
            const invite = payload.new as any;
            if (invite.status === 'removed') {
              toast.error("Your access was revoked for a document.");
            } else if (invite.status === 'role_updated') {
              toast.info("Your role was updated for a document.");
            } else {
              toast.success("You have a new invite!");
            }
            if (onNewEvent) onNewEvent();
            router.refresh()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'invites',
            filter: `email=eq.${user.email}`,
          },
          (payload) => {
            if (onNewEvent) onNewEvent();
            router.refresh()
          }
        )
        
      channel.subscribe()
    }

    setupRealtime()

    return () => {
      isMounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, router])

  return null
}
