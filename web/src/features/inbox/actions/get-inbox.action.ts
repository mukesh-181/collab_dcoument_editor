'use server'

import { createClient } from '@/lib/supabase/server'
import { FilterType } from '../components/inbox-client-list'

export async function getInbox(
  page: number = 0,
  limit: number = 15,
  filter: FilterType = "all"
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { data: [], count: 0 }

  let query = supabase
    .from('invites')
    .select(`
      id,
      token,
      document_id,
      role,
      status,
      created_at,
      expires_at,
      documents (
        title,
        owner:users!documents_owner_id_fkey(name, email, image),
        document_members (
          user:users(name, email, image)
        )
      )
    `, { count: 'exact' })
    .eq('email', user.email)

  // Apply server-side filtering
  if (filter === "invites") {
    query = query
      .in('status', ["pending", "accepted", "rejected", "expired"])
      .not('token', 'like', 'request:%')
      .not('token', 'like', 'request-denied:%');
  } else if (filter === "document") {
    query = query.or('status.in.(role_updated,removed,exited),token.like.request:*,token.like.request-denied:*');
  }

  // Apply pagination
  const from = page * limit
  const to = from + limit - 1
  
  const { data: invites, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching inbox:', error)
    return { data: [], count: 0 }
  }

  type InviteWithRequester = typeof invites[number] & {
    requester?: { name: string; email: string; image: string };
  };
  const processedInvites = (invites || []) as InviteWithRequester[]
  
  // Extract requester emails from tokens
  const requesterEmails = processedInvites
    .filter(inv => inv.token?.startsWith('request:'))
    .map(inv => inv.token.split(':')[2])
    .filter(Boolean)

  if (requesterEmails.length > 0) {
    const { data: requesters } = await supabase
      .from('users')
      .select('name, email, image')
      .in('email', requesterEmails)
      // RLS applies here. If the user can't see the requester, it returns []

    if (requesters) {
      processedInvites.forEach(inv => {
        if (inv.token?.startsWith('request:')) {
          const email = inv.token.split(':')[2]?.toLowerCase().trim()
          const requester = requesters.find(r => r.email?.toLowerCase().trim() === email)
          if (requester) {
            inv.requester = requester as { name: string; email: string; image: string };
          }
        }
      })
    }

    // If RLS blocked the direct lookup, try to find them in document_members
    processedInvites.forEach(inv => {
      if (inv.token?.startsWith('request:') && !inv.requester) {
        const email = inv.token.split(':')[2]?.toLowerCase().trim()
        
        const docsRaw = inv.documents
        const docsData = Array.isArray(docsRaw) ? docsRaw[0] : docsRaw
        if (docsData?.document_members) {
          const members = Array.isArray(docsData.document_members) ? docsData.document_members : [docsData.document_members]
          for (const member of members) {
            const u = Array.isArray(member.user) ? member.user[0] : member.user
            if (u && u.email?.toLowerCase().trim() === email) {
              inv.requester = u as { name: string; email: string; image: string };
              break
            }
          }
        }
      }
    })
  }

  return { data: processedInvites, count: count || 0 }
}
