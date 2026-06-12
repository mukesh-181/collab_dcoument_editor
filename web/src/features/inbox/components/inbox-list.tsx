import { getInbox } from "../actions/get-inbox.action";
import { InboxItem } from "./inbox-item";
import { InboxRealtimeListener } from "./inbox-realtime-listener";

export async function InboxList() {
  const invites = await getInbox();

  return (
    <div className="flex flex-col w-full h-full max-w-4xl mx-auto px-6 py-8">
      <InboxRealtimeListener />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Inbox</h1>
      
      {invites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">You're all caught up!</p>
          <p className="text-[14px] text-zinc-500 mt-1">You don't have any invitations.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {invites.map((invite) => (
            <InboxItem key={invite.id} invite={invite} />
          ))}
        </div>
      )}
    </div>
  );
}
