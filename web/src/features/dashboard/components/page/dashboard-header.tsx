'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from '@supabase/supabase-js'
import { MobileSidebar } from '../layout/mobile-sidebar'
import { SignOutButton } from '@/features/auth/components/sign-out-button'
import { getInitials } from "@/utils/string-utils";


export function DashboardHeader({ user, documents = [] }: { user: User | null, documents?: any[] }) {
  const rawName = user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email || 'User'
  const displayName = typeof rawName === 'string' ? rawName : 'User'
  const initial = displayName.charAt(0).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  return (
    <header className="h-14 shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-between px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex items-center gap-4">
        <MobileSidebar documents={documents} user={user} />
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-800">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-zinc-100 text-zinc-900 text-xs font-medium dark:bg-zinc-800 dark:text-zinc-100">{initial}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">{displayName}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SignOutButton />
      </div>
    </header>
  )
}
