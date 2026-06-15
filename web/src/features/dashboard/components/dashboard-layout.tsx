import { ReactNode } from "react";
import { getUserDocuments } from "../actions/get-user-documents.action";
import { SidebarContent } from "./layout/sidebar-content";
import { createClient } from "@/lib/supabase/server";

export async function DashboardLayout({ children }: { children: ReactNode }) {
  const documents = await getUserDocuments();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white/30 to-purple-50/40 dark:from-indigo-950/30 dark:via-zinc-950/30 dark:to-purple-950/30 relative">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[280px] flex-col overflow-hidden p-4 pr-0 relative z-10">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-white/80 to-indigo-50/60 dark:from-zinc-950/80 dark:to-indigo-950/40 backdrop-blur-md border border-zinc-200/60 shadow-sm dark:border-zinc-800/60 relative">
          <div className="absolute inset-0 z-[-1] bg-[url('/noise.png')] opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
          <SidebarContent documents={documents} user={user} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 pt-4 px-4 pb-4 md:px-6 relative z-10">
        {/* Dynamic Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl bg-gradient-to-b from-white/80 to-indigo-50/60 dark:from-zinc-950/80 dark:to-indigo-950/40 backdrop-blur-md shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 relative">
          <div className="absolute inset-0 z-[-1] bg-[url('/noise.png')] opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
          {children}
        </div>
      </main>
    </div>
  );
}
