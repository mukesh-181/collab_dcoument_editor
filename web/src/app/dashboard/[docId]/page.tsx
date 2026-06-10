import { redirect } from 'next/navigation'
import { getDocumentById } from '@/features/document/actions/get-document-by-id.action'
import { DocumentPage } from '@/features/document/components/document-page'
import { createClient } from '@/lib/supabase/server'

export default async function Page(props: { params: Promise<{ docId: string }> }) {
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
  const currentUserRole = document.document_members?.[0]?.role || 'viewer'

  return (
    <DocumentPage 
      document={document} 
      currentUserRole={currentUserRole} 
      currentUserName={currentUserName} 
      token={token} 
    />
  )
}
