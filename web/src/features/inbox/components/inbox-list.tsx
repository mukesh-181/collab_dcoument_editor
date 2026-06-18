import { getInbox } from "../actions/get-inbox.action";
import { InboxClientList } from "./inbox-client-list";
import type { InboxInvite } from "./inbox-item";

export async function InboxList() {
  const { data: rawInvites, count } = await getInbox();

  const invites: InboxInvite[] = (rawInvites || []).map((inv: Record<string, unknown>) => ({
    id: inv.id as string,
    token: inv.token as string,
    document_id: inv.document_id as string,
    role: inv.role as string,
    status: inv.status as string,
    created_at: inv.created_at as string,
    expires_at: (inv.expires_at as string) || null,
    documents: (() => {
        const raw = inv.documents;
        if (!raw) return undefined;
        // Supabase may return a single object or an array depending on relationship inference
        if (Array.isArray(raw)) {
          const doc = (raw as Array<Record<string, unknown>>)[0];
          if (!doc) return undefined;
          const ownerArr = doc.owner as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
          return {
            title: doc.title as string | undefined,
            owner: Array.isArray(ownerArr) ? ownerArr[0] : ownerArr,
          };
        } else {
          // Single object (many-to-one relationship resolved by PostgREST at runtime)
          const doc = raw as Record<string, unknown>;
          const ownerArr = doc.owner as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
          return {
            title: doc.title as string | undefined,
            owner: Array.isArray(ownerArr) ? ownerArr[0] : ownerArr,
          };
        }
      })(),
  }));

  return <InboxClientList initialInvites={invites} initialCount={count || 0} />;
}
