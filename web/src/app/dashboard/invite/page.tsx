import { getInviteDetails } from '@/features/invites/actions/get-invite-details.action'
import { createClient } from '@/lib/supabase/server'
import { InvitePage } from '@/features/invites/components/invite-page'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const token = resolvedParams.token

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let inviteDetails = null
  let error = null

  if (token && typeof token === 'string') {
    try {
      inviteDetails = await getInviteDetails(token)
    } catch (e: any) {
      error = e.message || 'The invite link may have expired or already been used.'
    }
  }

  return (
    <InvitePage 
      token={token} 
      user={user} 
      inviteDetails={inviteDetails} 
      error={error} 
    />
  )
}

