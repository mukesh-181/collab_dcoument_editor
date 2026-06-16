import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { ROUTES } from "@/constants/routes";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero({ user }: { user: User | null }) {
  return (
    <div className="mx-auto flex max-w-screen-md flex-col items-center mt-12">
     

      <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl md:text-7xl dark:text-zinc-50 leading-[1.1]">
        The new standard for <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 dark:from-cyan-300 dark:via-blue-400 dark:to-indigo-500 bg-clip-text text-transparent">collaboration.</span>
      </h1>
      
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        Streamline your document workflows and collaborate in real time with our powerful editing platform. Built on Yjs and Supabase for lightning-fast synchronization.
      </p>
      
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link href={user ? ROUTES.DASHBOARD : `${ROUTES.LOGIN}?tab=register`}>
          <Button className="h-12 px-8 text-base font-semibold shadow-xl rounded-full bg-zinc-900 text-white hover:bg-zinc-800 hover:-translate-y-0.5 transition-all duration-200 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 border border-zinc-200 dark:border-transparent">
            {user ? 'Go to Dashboard' : 'Start writing for free'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        {!user && (
          <Link href={`${ROUTES.LOGIN}?tab=login`}>
            <Button variant="outline" className="h-12 px-8 text-base font-medium rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
