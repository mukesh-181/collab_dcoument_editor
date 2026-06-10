import { DashboardHeader } from "@/features/dashboard/components/page/dashboard-header";
import { DocumentListSkeleton } from "@/features/dashboard/components/page/document-list-skeleton";

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <DashboardHeader user={null} />

      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
          <DocumentListSkeleton />
        </div>
      </div>
    </div>
  );
}
