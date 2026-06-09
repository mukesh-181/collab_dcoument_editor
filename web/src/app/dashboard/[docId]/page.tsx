import { redirect } from 'next/navigation'
import { getDocumentById, getDocumentContent } from '@/features/document/actions/document.actions'
import { DocumentHeader } from '@/features/document/components/document-header'
import { DocumentProvider } from '@/features/document/components/document-context'
import { Editor } from '@/features/editor/components/editor'

export default async function DocumentPage(props: { params: Promise<{ docId: string }> }) {
  const params = await props.params
  
  const document = await getDocumentById(params.docId)
  
  if (!document) {
    redirect('/dashboard')
  }

  const initialContent = await getDocumentContent(params.docId)
  
  // Extract the current user's role from the filtered document_members array
  const currentUserRole = document.document_members[0]?.role || 'viewer'

  return (
    <DocumentProvider>
      <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
        <DocumentHeader document={document} currentUserRole={currentUserRole} />
        
        <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
          <Editor initialContent={initialContent} documentId={document.id} currentUserRole={currentUserRole} />
        </div>
      </div>
    </DocumentProvider>
  )
}
