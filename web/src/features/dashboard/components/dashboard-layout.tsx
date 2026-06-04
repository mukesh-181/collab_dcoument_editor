import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Settings, LogOut } from 'lucide-react'
import { ReactNode } from 'react'
import { logout } from '@/features/auth/actions/auth.actions'

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">CollabDoc</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white mb-6">
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>

          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-3">Your Documents</div>
          <Link href="/dashboard/doc-1">
             <Button variant="ghost" className="w-full justify-start text-zinc-600 dark:text-zinc-300">
              <FileText className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Project Proposal</span>
            </Button>
          </Link>
          <Link href="/dashboard/doc-2">
             <Button variant="ghost" className="w-full justify-start text-zinc-600 dark:text-zinc-300">
              <FileText className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Meeting Notes</span>
            </Button>
          </Link>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="ghost" className="w-full justify-start text-zinc-600 dark:text-zinc-300">
            <Settings className="mr-2 h-4 w-4 shrink-0" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 shrink-0 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 flex items-center justify-end px-6">
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit" className="text-zinc-600 dark:text-zinc-300">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
