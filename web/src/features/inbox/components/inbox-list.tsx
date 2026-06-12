import { getInbox } from "../actions/get-inbox.action";
import { InboxClientList } from "./inbox-client-list";

export async function InboxList() {
  const invites = await getInbox();
  
  return <InboxClientList initialInvites={invites} />;
}
