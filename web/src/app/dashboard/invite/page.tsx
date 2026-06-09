import { redirect } from 'next/navigation'
import { getInviteDetails } from '@/features/invites/actions/invite.actions'
import { AlertCircle, CheckCircle2, FileText, UserPlus, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AcceptInviteButton } from '@/features/invites/components/accept-invite-button'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/features/auth/actions/auth.actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const token = resolvedParams.token

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const rawName = user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email || 'User'
  const displayName = typeof rawName === 'string' ? rawName : 'User'
  const initial = displayName.charAt(0).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  const Navbar = () => (
    <header className="h-14 shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-between px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-800">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-zinc-100 text-zinc-900 text-xs font-medium dark:bg-zinc-800 dark:text-zinc-100">{initial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">{displayName}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit" className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium h-8 px-3">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </div>
    </header>
  )

  if (!token || typeof token !== 'string') {
    return (
      <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-950">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl p-8 max-w-sm w-full flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Invalid Invite Link
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
              This invite link is missing or malformed.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  let inviteDetails = null

  try {
    inviteDetails = await getInviteDetails(token)
  } catch (error: any) {
    return (
      <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-950">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl p-8 max-w-sm w-full flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Failed to Join Document
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
              {error.message || 'The invite link may have expired or already been used.'}
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-950">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl p-8 max-w-sm w-full flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6">
            <UserPlus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            You've been invited!
          </h1>
          
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{inviteDetails.ownerName}</span> has invited you to join the document as a <span className="capitalize font-semibold text-zinc-900 dark:text-zinc-100">{inviteDetails.role}</span>.
          </p>

          <div className="flex items-center justify-center gap-3 w-full p-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-lg mb-8">
            <FileText className="w-5 h-5 text-indigo-500" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{inviteDetails.documentTitle}</span>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <AcceptInviteButton token={token} />
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

