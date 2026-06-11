'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText } from 'lucide-react'

import { DocumentActionMenu } from '../document-action-menu'

export function SidebarDocList({ documents }: { documents: any[] }) {
  const pathname = usePathname()

  if (documents.length === 0) {
    return <div className="px-3 text-[13px] text-zinc-500">No documents yet.</div>
  }

  return (
    <div className="space-y-0.5">
      {documents.map((doc: any) => {
        const isActive = pathname === `/dashboard/${doc.id}`
        const role = doc.document_members?.[0]?.role || 'viewer'

        return (
          <div
            key={doc.id}
            className={`group relative flex items-center h-9 px-3 rounded-xl transition-all ${
              isActive
                ? 'bg-white shadow-sm ring-1 ring-zinc-200/50 dark:bg-zinc-800 dark:ring-zinc-700/50'
                : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 has-[[data-state=open]]:bg-zinc-100/50 dark:has-[[data-state=open]]:bg-zinc-800/50'
            }`}
          >
            <Link
              href={`/dashboard/${doc.id}`}
              className="flex-1 min-w-0 h-full flex items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
            >
              <FileText
                className={`mr-2.5 h-[16px] w-[16px] shrink-0 ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                }`}
              />
              <span
                className={`truncate text-[13px] ${
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                    : 'font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100'
                }`}
              >
                {doc.title}
              </span>
            </Link>
            
            <div className="absolute right-2 z-10 flex items-center">
              <DocumentActionMenu
                documentId={doc.id}
                documentTitle={doc.title}
                role={role}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
