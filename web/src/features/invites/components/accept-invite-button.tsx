'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { acceptInvite } from '../actions/accept-invite.action'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ROUTES } from "@/constants/routes";

export function AcceptInviteButton({ token }: { token: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      const documentId = await acceptInvite(token)
      router.push(ROUTES.DOCUMENT(documentId))
    } catch (error) {
      console.error(error)
      // If it fails on click, reload the page to let the server-side error page take over
      window.location.reload()
    }
  }

  return (
    <Button onClick={handleAccept} disabled={isLoading} className="relative w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-md rounded-xl font-medium transition-all hover:-translate-y-0.5">
      <span className={isLoading ? "opacity-0" : ""}>Accept Invite</span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
    </Button>
  )
}
