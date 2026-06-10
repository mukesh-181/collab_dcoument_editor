import { FileText, Trash2, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { deleteDocument } from '@/features/dashboard/actions/delete-document.action'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DashboardDocument } from "../../types"
import { DocumentActionMenu } from "../document-action-menu"

export function DocumentList({ documents }: { documents: DashboardDocument[] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-8 flex shrink-0 justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Documents</h1>
          <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">Manage your recent projects and collaborations.</p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overscroll-contain rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-24 text-center dark:border-zinc-800 dark:bg-zinc-900/10">
          <FileText className="h-8 w-8 text-zinc-400 mb-3" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No documents yet</h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-sm">You haven&apos;t created any documents. Create one from the sidebar to start writing.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid shrink-0 grid-cols-[1fr_120px_120px_40px] gap-4 border-b border-zinc-200 bg-zinc-50/50 px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div>Name</div>
            <div>Role</div>
            <div>Last Updated</div>
            <div></div>
          </div>
          <div className="min-h-0 flex-1 divide-y divide-zinc-200 overflow-y-auto overscroll-contain dark:divide-zinc-800">
            {documents.map((doc) => {
              const deleteAction = deleteDocument.bind(null, doc.id)
              const role = doc.document_members?.[0]?.role || 'viewer'
              
              return (
                <div key={doc.id} className="grid grid-cols-[1fr_120px_120px_40px] gap-4 px-4 py-4 items-center group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 has-[[data-state=open]]:bg-zinc-50 dark:has-[[data-state=open]]:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="h-[18px] w-[18px] shrink-0 text-zinc-400" />
                    <Link href={`/dashboard/${doc.id}`} className="truncate text-[15px] font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                      {doc.title}
                    </Link>
                  </div>
                  <div className="text-[15px] text-zinc-500 capitalize">
                    {role}
                  </div>
                  <div className="text-[15px] text-zinc-500">
                    {new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex justify-end">
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
        </div>
      )}
    </div>
  )
}
