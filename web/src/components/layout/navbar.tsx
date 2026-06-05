import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 w-full items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm ring-1 ring-inset ring-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12Z" />
                <path d="M12 2C12 2 9 6.47715 9 12C9 17.5228 12 22 12 22" />
                <path d="M12 2C12 2 15 6.47715 15 12C15 17.5228 12 22 12 22" />
                <path d="M2 12H22" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tighter text-zinc-900 font-serif dark:text-zinc-50">CollabDoc</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard">
              <Button className="h-11 px-8 text-base bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg font-semibold cursor-pointer hover:-translate-y-0.5 hover:scale-105 transition-all duration-200">Get Started</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="h-11 px-6 text-base font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:scale-105 transition-all duration-200">Log in</Button>
              </Link>
              <Link href="/login?tab=register">
                <Button className="h-11 px-8 text-base bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg font-semibold cursor-pointer hover:-translate-y-0.5 hover:scale-105 transition-all duration-200">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
