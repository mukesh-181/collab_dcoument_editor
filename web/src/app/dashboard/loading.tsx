import { DashboardHeader } from "@/features/dashboard/components/page/dashboard-header";
import { DocumentListSkeleton } from "@/features/dashboard/components/page/document-list-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-full w-full">
      <DashboardHeader user={null} />

      <div className="p-4 sm:p-6 lg:p-8 w-full flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl">
          <DocumentListSkeleton />
        </div>
      </div>
    </div>
  );
}
