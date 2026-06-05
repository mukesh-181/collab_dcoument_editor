'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

export function SidebarDocList({ documents }: { documents: any[] }) {
  const pathname = usePathname()

  if (documents.length === 0) {
    return <div className="px-3 text-sm text-zinc-500">No documents yet.</div>
  }

  return (
    <>
      {documents.map((doc: any) => {
        const isActive = pathname === `/dashboard/${doc.id}`

        return (
          <Link key={doc.id} href={`/dashboard/${doc.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-start font-normal h-9 px-3 text-sm rounded-md transition-colors ${
                isActive
                  ? 'bg-zinc-300 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70'
              }`}
            >
              <FileText className={`mr-2.5 h-4 w-4 shrink-0 ${isActive ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'}`} />
              <span className="truncate">{doc.title}</span>
            </Button>
          </Link>
        )
      })}
    </>
  )
}
