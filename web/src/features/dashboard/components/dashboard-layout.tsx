import { ReactNode } from "react";
import { getUserDocuments } from "../actions/get-user-documents.action";
import { SidebarContent } from "./layout/sidebar-content";
import { createClient } from "@/lib/supabase/server";

export async function DashboardLayout({ children }: { children: ReactNode }) {
  const documents = await getUserDocuments();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[280px] flex-col overflow-hidden p-4 pr-0">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card border border-zinc-200/50 shadow-sm dark:border-zinc-800/50">
          <SidebarContent documents={documents} user={user} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 pt-4 px-4 pb-4 md:px-6">
        {/* Dynamic Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl bg-card shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">{children}</div>
      </main>
    </div>
  );
}
