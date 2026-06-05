import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Settings, LogOut } from 'lucide-react'
import { SidebarDocList } from './sidebar-doc-list'
import { ReactNode } from 'react'
import { logout } from '@/features/auth/actions/auth.actions'
import { getUserDocuments, createDocument } from '../actions/document.actions'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export async function DashboardLayout({ children }: { children: ReactNode }) {
  const documents = await getUserDocuments()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Extract user's name or fallback to their email/initial
  const rawName = user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email || 'User'
  const displayName = typeof rawName === 'string' ? rawName : 'User'
  const initial = displayName.charAt(0).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm ring-1 ring-inset ring-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12Z" />
              <path d="M12 2C12 2 9 6.47715 9 12C9 17.5228 12 22 12 22" />
              <path d="M12 2C12 2 15 6.47715 15 12C15 17.5228 12 22 12 22" />
              <path d="M2 12H22" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">CollabDoc</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="mb-4">
          <form action={createDocument}>
            <Button type="submit" className="w-full justify-start bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-none font-medium h-9">
              <Plus className="mr-2 h-4 w-4" />
              New Document
            </Button>
          </form>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 mx-1 mt-4" />
        </div>

        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-3">Your Documents</div>
        
        <SidebarDocList documents={documents} />
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <Button variant="ghost" size="sm" className="w-full justify-start text-zinc-600 dark:text-zinc-400 font-normal h-8">
          <Settings className="mr-2 h-4 w-4 shrink-0 text-zinc-400" />
          Settings
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30 flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-between px-4 sm:px-6 lg:px-8">
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

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
