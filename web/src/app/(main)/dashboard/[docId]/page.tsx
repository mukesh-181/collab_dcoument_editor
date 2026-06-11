import { redirect } from 'next/navigation'
import { getDocumentById } from '@/features/document/actions/get-document-by-id.action'
import { DocumentPage } from '@/features/document/components/document-page'
import { createClient } from '@/lib/supabase/server'
import { getUserDocuments } from '@/features/dashboard/actions/get-user-documents.action'

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
  const currentUserMember = document.all_members?.find((m: any) => m.user.id === user?.id)
  const currentUserName = currentUserMember?.user?.name || (user?.email ? user.email.split('@')[0] : 'Anonymous User')
  // Extract the current user's role from the filtered document_members array
  const currentUserRole = document.document_members?.[0]?.role || 'viewer'
  const documents = await getUserDocuments()

  return (
    <DocumentPage 
      document={document} 
      documents={documents}
      currentUserRole={currentUserRole} 
      currentUserName={currentUserName} 
      token={token} 
    />
  )
}
