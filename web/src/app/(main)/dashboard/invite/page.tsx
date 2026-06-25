import { getInviteDetails } from '@/features/invites/actions/get-invite-details.action'
import { createClient } from '@/lib/supabase/server'
import { InvitePage } from '@/features/invites/components/invite-page'
import { getUserName, getUserImage } from "@/utils/user-utils"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const token = resolvedParams.token

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('name, image')
      .eq('id', user.id)
      .single()
      
    if (dbUser && user.user_metadata) {
      user.user_metadata.full_name = getUserName(dbUser.name || user.user_metadata.full_name, user.email)
      user.user_metadata.avatar_url = getUserImage(dbUser.image || user.user_metadata.avatar_url)
    }
  }

  let inviteDetails = null
  let error = null

  if (token && typeof token === 'string') {
    try {
      inviteDetails = await getInviteDetails(token, user?.id)
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'The invite link may have expired or already been used.'
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

