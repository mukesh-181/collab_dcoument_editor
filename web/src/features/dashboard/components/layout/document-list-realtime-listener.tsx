'use client'

import { useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DocumentListRealtimeListener({ 
  userId, 
  onNewEvent 
}: { 
  userId?: string, 
  onNewEvent?: (silent: boolean) => void 
}) {
  const supabase = useMemo(() => createClient(), [])
  
  // Use a ref to always point to the latest callback (prevents stale closures)
  const onNewEventRef = useRef(onNewEvent);
  useEffect(() => {
    onNewEventRef.current = onNewEvent;
  }, [onNewEvent]);

  useEffect(() => {
    let isMounted = true
    let channel: ReturnType<typeof supabase.channel>

    const setupRealtime = async () => {
      // If no userId is passed, attempt to fetch the current user's session
      let activeUserId = userId;
      if (!activeUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          activeUserId = user.id;
        }
      }

      if (!isMounted || !activeUserId) return

      const channelName = `document-list-changes-${crypto.randomUUID()}`
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'document_members',
            filter: `user_id=eq.${activeUserId}`,
          },
          () => {
            if (onNewEventRef.current) onNewEventRef.current(true);
          }
        )
        // We also want to know if documents we own change their metadata (like title)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'documents',
            filter: `owner_id=eq.${activeUserId}`,
          },
          () => {
            if (onNewEventRef.current) onNewEventRef.current(true);
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
  }, [supabase, userId])

  return null
}
