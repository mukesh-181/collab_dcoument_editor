import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <Navbar />
      
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-screen-md flex-col items-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-7xl dark:text-zinc-50">
            Write together.
          </h1>
          
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            CollabDoc is a high-performance collaborative editor designed for speed, clarity, and focus. Built on Yjs and Supabase for real-time synchronization.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={user ? '/dashboard' : '/login?tab=register'}>
              <Button className="h-11 px-8 text-base font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-md transition-all">
                {user ? 'Go to Dashboard' : 'Start writing for free'}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
              </div>
            </div>
            <div className="p-8 sm:p-12">
              <div className="mx-auto max-w-2xl space-y-4 text-left">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Project Requirements</h2>
                <p className="text-zinc-500 leading-relaxed dark:text-zinc-400">
                  CollabDoc is designed to handle multiple concurrent users seamlessly. 
                  The underlying architecture relies on Conflict-free Replicated Data Types (CRDTs) to ensure that text merges deterministically without a central authority dictating state.
                </p>
                <div className="flex items-center gap-2 pt-4">
                  <div className="h-5 w-5 rounded-sm bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                    M
                  </div>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    Mukesh is editing...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-8 text-center">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          &copy; {new Date().getFullYear()} CollabDoc, Inc. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
