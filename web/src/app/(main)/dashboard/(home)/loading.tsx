import { DocumentListSkeleton } from "@/features/dashboard/components/page/document-list-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col flex-1 w-full min-h-0 overflow-hidden">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <DocumentListSkeleton />
      </div>
    </div>
  );
}
