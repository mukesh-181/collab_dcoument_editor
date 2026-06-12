import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

export function Hero({ user }: { user: User | null }) {
  return (
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
  )
}
