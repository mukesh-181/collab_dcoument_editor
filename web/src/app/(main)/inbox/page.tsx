import { InboxList } from "@/features/inbox/components/inbox-list";

export default function InboxPage() {
  return (
    <div className="flex flex-col flex-1 h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto">
      <InboxList />
    </div>
  );
}
