import { getUserDocuments, deleteDocument } from '@/features/dashboard/actions/document.actions'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Trash2 } from 'lucide-react'

export default async function DashboardHome() {
  const documents = await getUserDocuments()

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Documents</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Manage and access your collaborative documents.</p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-800">
          <FileText className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">No documents yet</h3>
          <p className="mt-2 text-sm text-zinc-500">Create a new document from the sidebar to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc: any) => {
            const deleteAction = deleteDocument.bind(null, doc.id)
            
            return (
              <Card key={doc.id} className="flex flex-col hover:border-indigo-500/50 transition-colors">
                <Link href={`/dashboard/${doc.id}`} className="flex-1">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                    <CardTitle className="mt-4 text-xl truncate">{doc.title}</CardTitle>
                    <CardDescription>
                      Last updated {new Date(doc.updated_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Link>
                <CardFooter className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 w-fit">
                      Role: {doc.document_members[0]?.role}
                    </span>
                    <span className="text-xs text-zinc-500 mt-2">
                      Owner: {doc.owner?.name || 'Unknown'}
                    </span>
                  </div>
                  
                  {doc.document_members[0]?.role === 'owner' && (
                    <form action={deleteAction}>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
