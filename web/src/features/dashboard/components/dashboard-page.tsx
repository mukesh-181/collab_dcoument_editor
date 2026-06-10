import { DashboardHeader } from "./page/dashboard-header";
import { DocumentList } from "./page/document-list";
import { User } from "@supabase/supabase-js";
import type { DashboardDocument } from "../types";

export function DashboardPage({
  user,
  documents,
}: {
  user: User | null;
  documents: DashboardDocument[];
}) {
  return (
    <div className="flex flex-col flex-1 w-full min-h-0 overflow-hidden">
      <DashboardHeader user={user} documents={documents} />

      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
          <DocumentList documents={documents} />
        </div>
      </div>
    </div>
  );
}
