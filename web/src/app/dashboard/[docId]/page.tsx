import { redirect } from 'next/navigation'
import { getDocumentById } from '@/features/document/actions/document.actions'
import { DocumentHeader } from '@/features/document/components/document-header'
import { DocumentProvider } from '@/features/document/components/document-context'
import { Editor } from '@/features/editor/components/editor'
import { createClient } from '@/lib/supabase/server'

export default async function DocumentPage(props: { params: Promise<{ docId: string }> }) {
  const params = await props.params
  
  const document = await getDocumentById(params.docId)
  
  if (!document) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''
  const currentUserName = user?.user_metadata?.full_name || 'Anonymous'
  
  // Extract the current user's role from the filtered document_members array
  const currentUserRole = document.document_members[0]?.role || 'viewer'

  return (
    <DocumentProvider>
      <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
        <DocumentHeader document={document} currentUserRole={currentUserRole} />
        
        <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
          <Editor documentId={document.id} currentUserRole={currentUserRole} currentUserName={currentUserName} token={token} />
        </div>
      </div>
    </DocumentProvider>
  )
}
