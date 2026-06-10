import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { logout } from '@/features/auth/actions/logout.action'
import { User } from '@supabase/supabase-js'
import { MobileSidebar } from '../layout/mobile-sidebar'

export function DashboardHeader({ user, documents = [] }: { user: User | null, documents?: any[] }) {
  const rawName = user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email || 'User'
  const displayName = typeof rawName === 'string' ? rawName : 'User'
  const initial = displayName.charAt(0).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  return (
    <header className="h-14 shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-between px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex items-center gap-4">
        <MobileSidebar documents={documents} />
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
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit" className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium h-8 px-3">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </div>
    </header>
  )
}
