import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from "@/constants/routes";

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-indigo-100/50 bg-indigo-50/50 backdrop-blur-xl dark:border-indigo-900/30 dark:bg-indigo-950/30 supports-[backdrop-filter]:bg-indigo-50/40 transition-all duration-300">
      <div className="flex h-16 w-full items-center justify-between px-6 md:px-10 lg:px-12">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.HOME} className="flex items-center gap-3 cursor-pointer transition-opacity">
            <Image 
              src="/logo-final.png" 
              alt="CollabDoc" 
              width={180} 
              height={50} 
              className="object-contain" 
              style={{ width: 'auto', height: 'auto' }}
              priority 
            />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href={ROUTES.DASHBOARD}>
              <Button className="h-10 px-6 text-sm rounded-full font-medium shadow-sm hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all duration-200 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 border-2 border-zinc-200 dark:border-transparent">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href={ROUTES.LOGIN}>
                <Button variant="outline" className="h-10 px-5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 rounded-full border-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all duration-200">
                  Log in
                </Button>
              </Link>
              <Link href={`${ROUTES.LOGIN}?tab=register`}>
                <Button className="h-10 px-6 text-sm rounded-full font-medium shadow-sm hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all duration-200 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 border-2 border-zinc-200 dark:border-transparent">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
