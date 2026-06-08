import { redirect } from 'next/navigation'
import { getDocumentById } from '@/features/document/actions/document.actions'
import { DocumentHeader } from '@/features/document/components/document-header'

export default async function DocumentPage(props: { params: Promise<{ docId: string }> }) {
  const params = await props.params
  
  const document = await getDocumentById(params.docId)
  
  if (!document) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <DocumentHeader document={document} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="h-[calc(100vh-12rem)] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center">
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Empty Editor Area (Phase 4)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
