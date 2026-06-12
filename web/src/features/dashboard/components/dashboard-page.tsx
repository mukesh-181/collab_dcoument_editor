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
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <DocumentList documents={documents} user={user} />
      </div>
    </div>
  );
}
