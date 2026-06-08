import { redirect } from 'next/navigation'
import { getDocumentById } from '@/features/document/actions/document.actions'
import { DocumentHeader } from '@/features/document/components/document-header'
import { Editor } from '@/features/editor/components/editor'

export default async function DocumentPage(props: { params: Promise<{ docId: string }> }) {
  const params = await props.params
  
  const document = await getDocumentById(params.docId)
  
  if (!document) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <DocumentHeader document={document} />
      
      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
        <Editor />
      </div>
    </div>
  )
}
