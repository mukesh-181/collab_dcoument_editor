import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Compass } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export default function NotFound() {
  return (
    <div className="flex h-full min-h-[100dvh] flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="relative flex flex-col items-center max-w-md text-center">
        {/* Decorative background glow */}
        <div className="absolute -z-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/20" />
        
        {/* Icon container */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/50 dark:bg-zinc-900 dark:ring-zinc-800/50 mb-8">
          <Compass className="h-10 w-10 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
        </div>

        {/* 404 Header */}
        <h1 className="text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
          404
        </h1>
        
        {/* Subtitle */}
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
          Page not found
        </h2>
        
        {/* Description */}
        <p className="text-base text-zinc-500 dark:text-zinc-400 mb-10 max-w-[280px] sm:max-w-none">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button asChild className="w-full sm:w-auto h-11 px-8 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-xl font-medium transition-all">
            <Link href={ROUTES.DASHBOARD}>
              Return to Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full sm:w-auto h-11 px-8 rounded-xl font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all">
            <Link href={ROUTES.HOME}>
              Go to Homepage
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
