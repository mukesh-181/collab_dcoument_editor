import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      
      <main className="flex flex-col items-center justify-center px-4 pt-32 pb-24 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
          Now in public beta
        </div>
        
        <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-extrabold tracking-tight text-zinc-900 sm:text-7xl dark:text-zinc-50">
          Write together,{' '}
          <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            in real-time.
          </span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 sm:text-xl dark:text-zinc-400">
          CollabDoc is the ultimate collaborative document editor. Experience lightning-fast synchronization, intuitive design, and robust access controls.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="h-14 px-8 text-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 transition-all rounded-full">
              Get Started for Free
            </Button>
          </Link>
          <Link href="https://github.com/mukesh" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium rounded-full">
              View on GitHub
            </Button>
          </Link>
        </div>

        <div className="mt-20 w-full max-w-5xl rounded-2xl border border-zinc-200 bg-white/50 p-2 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-4">
          <div className="aspect-[16/9] w-full rounded-xl bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-800">
            {/* Minimalist Editor Mockup */}
            <div className="w-full h-full flex flex-col">
              <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              <div className="p-8 space-y-4 max-w-3xl mx-auto w-full">
                <div className="h-10 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                <div className="h-4 w-4/6 bg-indigo-200 dark:bg-indigo-900/50 rounded animate-pulse relative">
                  <div className="absolute -left-2 -top-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">Mukesh is typing...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
