import { DashboardHeader } from "./page/dashboard-header";
import { DocumentList } from "./page/document-list";
import { User } from "@supabase/supabase-js";

export function DashboardPage({
  user,
  documents,
}: {
  user: User | null;
  documents: any[];
}) {
  return (
    <div className="flex flex-col h-full w-full">
      <DashboardHeader user={user} documents={documents} />

      <div className="p-4 sm:p-6 lg:p-8 w-full flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl">
          <DocumentList documents={documents} />
        </div>
      </div>
    </div>
  );
}
