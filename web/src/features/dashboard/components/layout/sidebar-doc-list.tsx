'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

import { DocumentActionMenu } from '../document-action-menu'

export function SidebarDocList({ documents }: { documents: any[] }) {
  const pathname = usePathname()

  if (documents.length === 0) {
    return <div className="px-3 text-sm text-zinc-500">No documents yet.</div>
  }

  return (
    <>
      {documents.map((doc: any) => {
        const isActive = pathname === `/dashboard/${doc.id}`
        const role = doc.document_members?.[0]?.role || 'viewer'

        return (
          <div
            key={doc.id}
            className={`group relative flex items-center h-10 rounded-md transition-colors ${
              isActive
                ? 'bg-zinc-300 dark:bg-zinc-700'
                : 'hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70 has-[[data-state=open]]:bg-zinc-200/70 dark:has-[[data-state=open]]:bg-zinc-800/70'
            }`}
          >
            <Link
              href={`/dashboard/${doc.id}`}
              className="flex-1 min-w-0 h-full flex items-center px-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
            >
              <FileText
                className={`mr-2.5 h-[18px] w-[18px] shrink-0 ${
                  isActive ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                }`}
              />
              <span
                className={`truncate text-[15px] ${
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 font-normal group-hover:text-zinc-900 dark:group-hover:text-zinc-100'
                }`}
              >
                {doc.title}
              </span>
            </Link>
            
            <div className="absolute right-1 z-10 flex items-center">
              <DocumentActionMenu
                documentId={doc.id}
                documentTitle={doc.title}
                role={role}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
