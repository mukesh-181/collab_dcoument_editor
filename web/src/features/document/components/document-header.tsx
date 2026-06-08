import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface DocumentHeaderProps {
  document: {
    id: string
    title: string
    updated_at: string
  }
}

export function DocumentHeader({ document }: DocumentHeaderProps) {
  return (
    <div className="flex items-center justify-between h-14 pr-4 pl-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <div className="flex flex-col ml-1">
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate max-w-[200px] sm:max-w-[400px]">
            {document.title}
          </h1>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Last modified {new Date(document.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}
