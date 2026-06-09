import { redirect } from 'next/navigation'
import { acceptInvite } from '@/features/invites/actions/invite.actions'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const token = resolvedParams.token

  if (!token || typeof token !== 'string') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Invalid Invite Link
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-sm">
          This invite link is missing or malformed.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    )
  }

  let documentId: string | null = null

  try {
    documentId = await acceptInvite(token)
  } catch (error: any) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Failed to Join Document
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-sm">
          {error.message || 'The invite link may have expired or already been used.'}
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    )
  }

  // If successful, redirect outside of try/catch
  if (documentId) {
    redirect(`/dashboard/${documentId}`)
  }
}

