import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from "@/constants/routes";

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 w-full items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.HOME} className="flex items-center gap-3 cursor-pointer">
            <Image src="/Logo.png" alt="CollabDoc" width={300} height={40} className="h-12 w-auto" style={{ width: "auto" }} priority />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href={ROUTES.DASHBOARD}>
              <Button className="h-11 px-8 text-base bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg font-semibold cursor-pointer hover:-translate-y-0.5 hover:scale-105 transition-all duration-200">Get Started</Button>
            </Link>
          ) : (
            <>
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost" className="h-11 px-6 text-base font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:scale-105 transition-all duration-200">Log in</Button>
              </Link>
              <Link href={`${ROUTES.LOGIN}?tab=register`}>
                <Button className="h-11 px-8 text-base bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg font-semibold cursor-pointer hover:-translate-y-0.5 hover:scale-105 transition-all duration-200">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
