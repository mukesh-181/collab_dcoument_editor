'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { acceptInvite } from '../actions/accept-invite.action'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function AcceptInviteButton({ token }: { token: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      const documentId = await acceptInvite(token)
      router.push(`/dashboard/${documentId}`)
    } catch (error) {
      console.error(error)
      // If it fails on click, reload the page to let the server-side error page take over
      window.location.reload()
    }
  }

  return (
    <Button onClick={handleAccept} disabled={isLoading} className="w-full">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Joining...
        </>
      ) : (
        'Accept Invite'
      )}
    </Button>
  )
}
