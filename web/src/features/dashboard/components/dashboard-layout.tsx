import { ReactNode } from "react";
import { getUserDocuments } from "../actions/get-user-documents.action";
import { createClient } from "@/lib/supabase/server";
import { SidebarContent } from "./layout/sidebar-content";
export async function DashboardLayout({ children }: { children: ReactNode }) {
  const documents = await getUserDocuments();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30 flex-col">
        <SidebarContent documents={documents} />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
