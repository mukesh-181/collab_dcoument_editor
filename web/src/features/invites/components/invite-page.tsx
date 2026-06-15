import { AlertCircle, FileText, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AcceptInviteButton } from '@/features/invites/components/accept-invite-button'
import { SignOutButton } from '@/features/auth/components/sign-out-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from '@supabase/supabase-js'
import { ROUTES } from "@/constants/routes";
import { getInitials } from "@/utils/string-utils";


interface InvitePageProps {
  token: string | string[] | undefined
  user: User | null
  inviteDetails: any | null
  error: string | null
}

export function InvitePage({ token, user, inviteDetails, error }: InvitePageProps) {
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
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">{displayName}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SignOutButton />
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
              <Link href={ROUTES.DASHBOARD}>Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
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
              {error || 'The invite link may have expired or already been used.'}
            </p>
            <Button asChild className="w-full">
              <Link href={ROUTES.DASHBOARD}>Go to Dashboard</Link>
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
          
          {inviteDetails?.isAlreadyMember ? (
            <>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Already a Member
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                You are already a member of this document.
              </p>
              
              <div className="flex items-center justify-center gap-3 w-full p-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-lg mb-8">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{inviteDetails?.documentTitle}</span>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-none">
                  <Link href={ROUTES.DOCUMENT(inviteDetails?.documentId)}>Go to Document</Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-zinc-200 dark:border-zinc-700">
                  <Link href={ROUTES.DASHBOARD}>Return to Dashboard</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                You've been invited!
              </h1>
              
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{inviteDetails?.ownerName}</span> has invited you to join the document as a <span className="capitalize font-semibold text-zinc-900 dark:text-zinc-100">{inviteDetails?.role}</span>.
              </p>

              <div className="flex items-center justify-center gap-3 w-full p-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-lg mb-8">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{inviteDetails?.documentTitle}</span>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <AcceptInviteButton token={token as string} />
                <Button asChild variant="outline" className="w-full">
                  <Link href={ROUTES.DASHBOARD}>Cancel</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
