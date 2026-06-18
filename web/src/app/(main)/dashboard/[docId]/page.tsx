import { NoPermissionPage } from '@/features/document/components/page/no-permission-page'
import { getDocumentById } from '@/features/document/actions/get-document-by-id.action'
import { DocumentPage } from '@/features/document/components/document-page'
import { createClient } from '@/lib/supabase/server'
import { getUserDocuments } from '@/features/dashboard/actions/get-user-documents.action'
import { extractUserInfo } from "@/utils/user-utils";


export default async function Page(props: { params: Promise<{ docId: string }> }) {
  const params = await props.params
  
  const document = await getDocumentById(params.docId)
  
  if (!document) {
    return <NoPermissionPage />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''
  const currentUserMember = document.all_members?.find((m: { user: { id: string } }) => m.user.id === user?.id)
  
  // Extract all user fields using the single utility
  const { name: currentUserName, image: currentUserImage, role: currentUserRole } = extractUserInfo(
    currentUserMember?.user || user,
    document.document_members?.[0]?.role
  );
  const { documents } = await getUserDocuments()

  return (
    <DocumentPage 
      document={document} 
      documents={documents}
      currentUserRole={currentUserRole} 
      currentUserName={currentUserName}
      currentUserImage={currentUserImage}
      token={token} 
    />
  )
}
