'use client'

import { useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DocumentActivityRealtimeListener({ 
  documentId, 
  onNewEvent 
}: { 
  documentId: string, 
  onNewEvent?: (silent: boolean) => void 
}) {
  const supabase = useMemo(() => createClient(), [])
  
  const onNewEventRef = useRef(onNewEvent);
  useEffect(() => {
    onNewEventRef.current = onNewEvent;
  }, [onNewEvent]);

  useEffect(() => {
    let isMounted = true
    let channel: ReturnType<typeof supabase.channel>

    const setupRealtime = async () => {
      if (!isMounted || !documentId) return

      const channelName = `document-activity-changes-${crypto.randomUUID()}`
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'document_activity',
            filter: `document_id=eq.${documentId}`,
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
  }, [supabase, documentId])

  return null
}
