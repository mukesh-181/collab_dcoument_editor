import { FileText, Trash2, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { deleteDocument } from '@/features/dashboard/actions/delete-document.action'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DocumentList({ documents }: { documents: any[] }) {
  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Documents</h1>
          <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">Manage your recent projects and collaborations.</p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-zinc-200 border-dashed rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10 dark:border-zinc-800">
          <FileText className="h-8 w-8 text-zinc-400 mb-3" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No documents yet</h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-sm">You haven't created any documents. Create one from the sidebar to start writing.</p>
        </div>
      ) : (
        <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_120px_40px] gap-4 px-4 py-3 border-b border-zinc-200 bg-zinc-50/50 text-xs font-medium text-zinc-500 uppercase tracking-wider dark:bg-zinc-900/50 dark:border-zinc-800">
            <div>Name</div>
            <div>Role</div>
            <div>Last Updated</div>
            <div></div>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {documents.map((doc: any) => {
              const deleteAction = deleteDocument.bind(null, doc.id)
              const role = doc.document_members?.[0]?.role || 'viewer'
              
              return (
                <div key={doc.id} className="grid grid-cols-[1fr_120px_120px_40px] gap-4 px-4 py-3 items-center group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                    <Link href={`/dashboard/${doc.id}`} className="truncate text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                      {doc.title}
                    </Link>
                  </div>
                  <div className="text-sm text-zinc-500 capitalize">
                    {role}
                  </div>
                  <div className="text-sm text-zinc-500">
                    {new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex justify-end">
                    {role === 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <form action={deleteAction}>
                            <DropdownMenuItem asChild variant="destructive">
                              <button type="submit" className="w-full cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </button>
                            </DropdownMenuItem>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
