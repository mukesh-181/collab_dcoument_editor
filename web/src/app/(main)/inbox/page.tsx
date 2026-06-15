import { InboxList } from "@/features/inbox/components/inbox-list";

export default function InboxPage() {
  return (
    <div className="flex flex-col flex-1 h-full w-full overflow-y-auto relative">
      <InboxList />
    </div>
  );
}
